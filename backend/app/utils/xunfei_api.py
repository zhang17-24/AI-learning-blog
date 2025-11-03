"""
大模型API调用工具类（兼容旧版API）
使用LLM抽象层，支持多种大模型提供商
"""
import json
from datetime import datetime
from flask import current_app

from .llm_providers import get_llm_provider


class XunfeiAPI:
    """
    兼容旧版API的封装类
    实际调用使用LLM抽象层，支持多种提供商
    """
    
    def __init__(self, appid=None, api_key=None, api_secret=None, domain=None):
        """
        初始化API配置（兼容旧版）
        
        Args:
            appid: 应用ID（可选，从配置读取）
            api_key: API密钥（可选，从配置读取）
            api_secret: API密钥Secret（可选，从配置读取）
            domain: 模型ID（可选，从配置读取）
        """
        # 保持旧版API兼容性，但实际使用LLM抽象层
        try:
            self.appid = appid or current_app.config.get('XUNFEI_APPID', '')
            self.api_key = api_key or current_app.config.get('XUNFEI_API_KEY', '')
            self.api_secret = api_secret or current_app.config.get('XUNFEI_API_SECRET', '')
            self.domain = domain or current_app.config.get('XUNFEI_DOMAIN', 'lite')
            self.base_url = current_app.config.get(
                'XUNFEI_API_URL', 
                'wss://spark-api.xf-yun.com/v1.1/chat'
            )
        except RuntimeError:
            # 如果不在应用上下文中，使用传入的参数或默认值
            self.appid = appid or ''
            self.api_key = api_key or ''
            self.api_secret = api_secret or ''
            self.domain = domain or 'lite'
            self.base_url = 'wss://spark-api.xf-yun.com/v1.1/chat'
        
        # 获取LLM提供商实例
        self._provider = None
        self._init_provider()
    
    def _init_provider(self):
        """初始化LLM提供商"""
        try:
            self._provider = get_llm_provider()
        except Exception as e:
            try:
                current_app.logger.warning(f'初始化LLM提供商失败: {str(e)}，使用默认配置')
            except:
                pass
            # 如果获取失败，创建默认的讯飞提供商
            try:
                from .llm_providers.xunfei import XunfeiProvider
                self._provider = XunfeiProvider({
                    'appid': self.appid,
                    'api_key': self.api_key,
                    'api_secret': self.api_secret,
                    'domain': self.domain,
                    'base_url': self.base_url
                })
            except Exception:
                self._provider = None
    
    def chat(self, messages, temperature=0.5, max_tokens=4096):
        """
        调用大模型聊天接口（使用LLM抽象层）
        
        Args:
            messages: 对话消息列表，格式：[{"role": "user", "content": "..."}]
            temperature: 温度参数，控制随机性，范围0-1
            max_tokens: 最大生成token数
            
        Returns:
            dict: API响应结果，包含content字段
        """
        if not self._provider:
            return {
                'success': False,
                'error': 'LLM提供商未初始化，请检查配置'
            }
        
        try:
            result = self._provider.chat(messages, temperature, max_tokens)
            # 保持旧版API兼容性，添加raw字段
            if result.get('success'):
                result['raw'] = {'content': result.get('content', '')}
            else:
                result['raw'] = {'error': result.get('error', '')}
            return result
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            try:
                current_app.logger.error(f'LLM API调用异常: {str(e)}\n{error_detail}')
            except:
                print(f'LLM API调用异常: {str(e)}\n{error_detail}')
            return {
                'success': False,
                'error': f'API调用异常: {str(e)}',
                'raw': {'error': str(e)}
            }
    
    def simple_chat(self, prompt, system_prompt=None):
        """
        简单对话接口，自动构建消息格式
        
        Args:
            prompt: 用户输入的问题或提示
            system_prompt: 系统提示词（可选）
            
        Returns:
            str: AI回复内容，失败时返回None
        """
        if not self._provider:
            try:
                current_app.logger.error('LLM提供商未初始化')
            except:
                pass
            return None
        
        try:
            return self._provider.simple_chat(prompt, system_prompt)
        except Exception as e:
            try:
                current_app.logger.error(f'LLM API调用失败: {str(e)}')
            except:
                print(f'LLM API调用失败: {str(e)}')
            return None


def analyze_file_content(content, file_type='text'):
    """
    分析文件内容并给出任务完成时间估计和着手建议
    
    Args:
        content: 文件内容（文本）
        file_type: 文件类型
        
    Returns:
        dict: 包含分析结果、时间估计和建议
    """
    try:
        api = XunfeiAPI()
        
        # 不再限制内容长度，让AI处理完整内容
        # content_limited = content[:3000] if len(content) > 3000 else content
        
        # 构建更清晰的提示词
        file_type_desc = {
            'text': '文本文件',
            'code': '代码文件',
            'document': '文档',
            'homework': '作业或任务'
        }.get(file_type, '文件')
        
        prompt = f"""你是一个专业的学习助手，擅长分析学习任务并提供实用的建议。

现在请分析以下{file_type_desc}的内容：

---
{content}
---

请详细分析并提供以下三个部分：

1. **内容摘要**：简要说明这份文件或任务的主要内容、目的和关键信息
2. **预估完成时间**：根据任务复杂度和内容量，合理估计完成该任务所需的时间（单位：小时，必须是数字）
3. **着手建议**：提供3-5条具体的、可执行的建议，帮助用户更好地开始完成这个任务

请严格以JSON格式返回结果，不要包含任何额外的文字说明：
{{
    "summary": "内容摘要内容",
    "estimated_hours": 数字,
    "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}}

注意：
- estimated_hours 必须是一个数字，如 2、3.5、0.5 等
- suggestions 必须是一个数组，包含3-5条具体建议
- 返回的内容必须是纯JSON格式，不要有额外的markdown格式标记
"""
        
        result = api.simple_chat(
            prompt,
            system_prompt="你是一个专业的学习助手，擅长分析学习任务并提供实用的建议。你的回答必须简洁、准确、可操作。"
        )
        
        if result:
            try:
                # 尝试解析JSON格式的响应
                import re
                # 提取JSON部分
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    analysis = json.loads(json_match.group())
                    return {
                        'success': True,
                        'summary': analysis.get('summary', ''),
                        'estimated_hours': analysis.get('estimated_hours', 0),
                        'suggestions': analysis.get('suggestions', [])
                    }
                else:
                    # 如果无法解析JSON，返回原始文本
                    return {
                        'success': True,
                        'summary': result[:500],
                        'estimated_hours': 0,
                        'suggestions': [result]
                    }
            except json.JSONDecodeError as e:
                # JSON解析错误，返回原始文本
                try:
                    from flask import current_app
                    current_app.logger.error(f'解析AI响应JSON失败: {str(e)}')
                except:
                    print(f'解析AI响应JSON失败: {str(e)}')
                
                return {
                    'success': True,
                    'summary': result[:500] if result else '分析完成',
                    'estimated_hours': 0,
                    'suggestions': [result] if result else ['请查看内容摘要获取详细信息']
                }
            except Exception as e:
                # 其他错误
                try:
                    from flask import current_app
                    current_app.logger.error(f'解析AI响应失败: {str(e)}')
                except:
                    print(f'解析AI响应失败: {str(e)}')
                
                return {
                    'success': True,
                    'summary': result[:500] if result else '分析完成',
                    'estimated_hours': 0,
                    'suggestions': [result] if result else ['请查看内容摘要获取详细信息']
                }
        else:
            # API调用失败，返回更详细的错误信息
            error_info = 'AI分析失败，请稍后重试'
            try:
                from flask import current_app
                current_app.logger.error(f'API调用返回None，可能的原因：API密钥错误、网络问题或API格式不正确')
            except:
                print(f'API调用返回None，可能的原因：API密钥错误、网络问题或API格式不正确')
            return {
                'success': False,
                'error': error_info
            }
    except Exception as e:
        # 记录错误
        try:
            from flask import current_app
            current_app.logger.error(f'文件分析异常: {str(e)}')
        except:
            print(f'文件分析异常: {str(e)}')
        
        return {
            'success': False,
            'error': f'分析过程出错: {str(e)}'
        }


def get_daily_motivation_and_music():
    """
    获取每日激励语句和歌曲推荐
    
    Returns:
        dict: 包含激励语句和歌曲推荐
    """
    try:
        api = XunfeiAPI()
        
        # 获取当前日期
        today = datetime.now().strftime('%Y年%m月%d日')
        day_of_week = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][datetime.now().weekday()]
        
        prompt = f"""今天是{today}，{day_of_week}。请为我提供：
1. 一条激励学习的语句（30字以内，温暖、鼓舞人心）
2. 一首适合学习的歌曲推荐（包含歌曲名和歌手）

请以JSON格式返回，格式如下：
{{
    "motivation": "激励语句",
    "song": {{
        "name": "歌曲名",
        "artist": "歌手名",
        "reason": "推荐理由（为什么适合学习时听）"
    }}
}}
"""
        
        result = api.simple_chat(
            prompt,
            system_prompt="你是一个贴心的学习助手，擅长用温暖的话语鼓励学习者，并为不同场景推荐合适的音乐。"
        )
        
        if result:
            try:
                # 尝试解析JSON格式的响应
                import re
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                    return {
                        'success': True,
                        'motivation': data.get('motivation', '今天也要加油学习哦！💪'),
                        'song': data.get('song', {
                            'name': '未知',
                            'artist': '未知',
                            'reason': '推荐一首轻音乐，帮助集中注意力'
                        })
                    }
                else:
                    # 如果无法解析JSON，返回默认值
                    return {
                        'success': True,
                        'motivation': result[:50] if result else '今天也要加油学习哦！💪',
                        'song': {
                            'name': '轻音乐推荐',
                            'artist': 'Various Artists',
                            'reason': '适合学习的背景音乐'
                        }
                    }
            except Exception as e:
                try:
                    from flask import current_app
                    current_app.logger.error(f'解析激励内容失败: {str(e)}')
                except:
                    print(f'解析激励内容失败: {str(e)}')
                return {
                    'success': True,
                    'motivation': result[:50] if result else '今天也要加油学习哦！💪',
                    'song': {
                        'name': '轻音乐推荐',
                        'artist': 'Various Artists',
                        'reason': '适合学习的背景音乐'
                    }
                }
        else:
            # API调用失败，返回默认值
            return {
                'success': True,
                'motivation': '今天也要加油学习哦！💪',
                'song': {
                    'name': '轻音乐推荐',
                    'artist': 'Various Artists',
                    'reason': '适合学习的背景音乐'
                }
            }
    except Exception as e:
        try:
            from flask import current_app
            current_app.logger.error(f'获取每日激励异常: {str(e)}')
        except:
            print(f'获取每日激励异常: {str(e)}')
        
        # 返回默认值
        return {
            'success': True,
            'motivation': '今天也要加油学习哦！💪',
            'song': {
                'name': '轻音乐推荐',
                'artist': 'Various Artists',
                'reason': '适合学习的背景音乐'
            }
        }


def break_down_learning_goal(goal_description, knowledge_background=''):
    """
    将学习目标拆解为可执行步骤，并根据知识关联性推荐学习顺序
    
    Args:
        goal_description: 学习目标描述
        knowledge_background: 用户的知识背景（可选）
        
    Returns:
        dict: 包含拆解步骤、推荐顺序和建议
    """
    try:
        api = XunfeiAPI()
        
        # 构建提示词
        background_prompt = f"\n\n用户的知识背景：{knowledge_background}" if knowledge_background else ""
        
        prompt = f"""你是一个专业的学习规划师，擅长将学习目标拆解为可执行的步骤，并根据知识关联性推荐最优的学习顺序。

请分析以下学习目标并拆解为具体步骤：

学习目标：{goal_description}{background_prompt}

请提供以下内容：

1. **学习步骤拆解**：将目标拆分为5-8个具体的、可执行的学习步骤
2. **推荐学习顺序**：根据知识点的关联性和逻辑关系，给出最优的学习顺序（用数字1、2、3...表示）
3. **每个步骤的预计时间**：预估完成每个步骤所需的时间（单位：小时或分钟）
4. **前置知识要求**：每个步骤需要掌握哪些前置知识

请以JSON格式返回结果，格式如下：
{{
    "steps": [
        {{
            "order": 1,
            "title": "步骤标题",
            "description": "步骤详细描述",
            "estimated_time": "2小时",
            "prerequisites": ["前置知识1", "前置知识2"]
        }},
        {{
            "order": 2,
            "title": "步骤标题",
            "description": "步骤详细描述",
            "estimated_time": "1.5小时",
            "prerequisites": ["前置知识1"]
        }}
    ],
    "learning_path": "整体学习路径说明"
}}

注意：
- 步骤数量建议在5-8个之间
- estimated_time 格式为"X小时"或"X分钟"
- prerequisites 是数组，列出前置知识
- learning_path 是对整体学习路径的概括说明
- 返回的内容必须是纯JSON格式，不要有额外的markdown格式标记
"""
        
        result = api.simple_chat(
            prompt,
            system_prompt="你是一个专业的学习规划师，擅长将复杂的学习目标拆解为可执行的步骤，并根据知识关联性设计最优的学习路径。你的回答要具体、可操作，符合学习者的认知规律。"
        )
        
        if result:
            try:
                # 尝试解析JSON格式的响应
                import re
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                    return {
                        'success': True,
                        'steps': data.get('steps', []),
                        'learning_path': data.get('learning_path', '')
                    }
                else:
                    # 如果无法解析JSON，返回默认值
                    return {
                        'success': True,
                        'steps': [
                            {
                                'order': 1,
                                'title': '学习目标拆解',
                                'description': result[:200],
                                'estimated_time': '未预估',
                                'prerequisites': []
                            }
                        ],
                        'learning_path': '请查看步骤详情'
                    }
            except Exception as e:
                try:
                    from flask import current_app
                    current_app.logger.error(f'解析学习目标拆解结果失败: {str(e)}')
                except:
                    print(f'解析学习目标拆解结果失败: {str(e)}')
                
                return {
                    'success': True,
                    'steps': [
                        {
                            'order': 1,
                            'title': '学习目标拆解',
                            'description': result[:200] if result else '拆解中...',
                            'estimated_time': '未预估',
                            'prerequisites': []
                        }
                    ],
                    'learning_path': '请查看步骤详情'
                }
        else:
            return {
                'success': False,
                'error': 'AI拆解失败，请稍后重试'
            }
    except Exception as e:
        try:
            from flask import current_app
            current_app.logger.error(f'学习目标拆解异常: {str(e)}')
        except:
            print(f'学习目标拆解异常: {str(e)}')
        
        return {
            'success': False,
            'error': f'拆解过程出错: {str(e)}'
        }


def chat_with_ai(message, conversation_history=[]):
    """
    AI学习伙伴：对话式答疑和情绪陪伴
    
    Args:
        message: 用户消息
        conversation_history: 对话历史（可选）
        
    Returns:
        dict: 包含AI回复
    """
    try:
        api = XunfeiAPI()
        
        # 构建对话历史
        messages = []
        
        # 添加系统提示词
        messages.append({
            'role': 'system',
            'content': """你是一位贴心的AI学习伙伴，具有以下特点：
1. **耐心专业**：能够详细解答学习问题，包括数学公式推导、概念解释、题目解答等
2. **情绪陪伴**：在用户遇到困难时给予鼓励，在用户取得进步时给予赞扬
3. **通俗易懂**：用简单明了的方式解释复杂的概念，避免过于学术化的表达
4. **积极向上**：始终保持积极正面的态度，帮助用户建立学习信心
5. **个性化**：根据对话内容判断用户的学习状态和需求，提供个性化的帮助

无论是学习问题还是情绪需要，你都应该耐心、专业地提供帮助。"""
        })
        
        # 添加对话历史
        for hist_msg in conversation_history[-6:]:  # 只保留最近6轮对话
            messages.append({
                'role': hist_msg.get('role', 'user'),
                'content': hist_msg.get('content', '')
            })
        
        # 添加当前消息
        messages.append({
            'role': 'user',
            'content': message
        })
        
        result = api.chat(messages, temperature=0.7)
        
        if result.get('success'):
            return {
                'success': True,
                'reply': result.get('content', '')
            }
        else:
            return {
                'success': False,
                'error': result.get('error', 'AI回复失败')
            }
    except Exception as e:
        try:
            from flask import current_app
            current_app.logger.error(f'AI对话异常: {str(e)}')
        except:
            print(f'AI对话异常: {str(e)}')
        
        return {
            'success': False,
            'error': f'对话过程出错: {str(e)}'
        }