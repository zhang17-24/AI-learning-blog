"""
OpenAI兼容API提供商（支持OpenAI、DeepSeek、Groq等）
"""
import json
from typing import List, Dict, Optional, Any
import requests

from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    """OpenAI兼容API提供商（支持OpenAI、DeepSeek、Groq等）"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        初始化OpenAI兼容API配置
        
        Args:
            config: 配置字典，包含以下键：
                - api_key: API密钥
                - base_url: API基础URL（如：https://api.openai.com/v1 或 https://api.deepseek.com/v1）
                - model: 模型名称（如：gpt-3.5-turbo, deepseek-chat, gpt-4等）
        """
        super().__init__(config)
        self.api_key = config.get('api_key', '')
        self.base_url = config.get('base_url', 'https://api.openai.com/v1').rstrip('/')
        self.model = config.get('model', 'gpt-3.5-turbo')
    
    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 4096) -> Dict[str, Any]:
        """
        调用OpenAI兼容API聊天接口
        
        Args:
            messages: 对话消息列表
            temperature: 温度参数
            max_tokens: 最大生成token数
            
        Returns:
            dict: API响应结果
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': 'API密钥未配置'
                }
            
            url = f"{self.base_url}/chat/completions"
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': self.model,
                'messages': messages,
                'temperature': temperature,
                'max_tokens': max_tokens
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # 提取回复内容
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            if content:
                return {
                    'success': True,
                    'content': content
                }
            else:
                return {
                    'success': False,
                    'error': 'API返回空内容'
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'API请求失败: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'API调用异常: {str(e)}'
            }
    
    def simple_chat(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        简单对话接口
        
        Args:
            prompt: 用户输入
            system_prompt: 系统提示词
            
        Returns:
            str: AI回复内容
        """
        messages = []
        
        if system_prompt:
            messages.append({
                'role': 'system',
                'content': system_prompt
            })
        
        messages.append({
            'role': 'user',
            'content': prompt
        })
        
        result = self.chat(messages)
        
        if result.get('success'):
            return result.get('content', '')
        else:
            return None
    
    def check_config(self) -> Dict[str, Any]:
        """
        检查配置是否完整
        
        Returns:
            dict: 配置检查结果
        """
        missing = []
        
        if not self.api_key:
            missing.append('api_key')
        if not self.base_url:
            missing.append('base_url')
        if not self.model:
            missing.append('model')
        
        return {
            'valid': len(missing) == 0,
            'missing': missing,
            'provider': 'openai'
        }
