"""
AI智能功能路由
"""
from flask import Blueprint, request, jsonify, current_app, send_file
from app.utils.auth import login_required
from app.utils.xunfei_api import analyze_file_content, get_daily_motivation_and_music, break_down_learning_goal, chat_with_ai
from app.models import AIChatSession, AIChatMessage, db
from datetime import datetime
import os
import tempfile

bp = Blueprint('ai', __name__)


@bp.route('/extract-text', methods=['POST'])
@login_required
def extract_text():
    """
    从上传的文件中提取文本内容（支持Word文档）
    
    请求:
        multipart/form-data
        file: 文件对象
    
    返回:
        {
            "success": true,
            "content": "提取的文本内容",
            "filename": "文件名"
        }
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': '请上传文件'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': '未选择文件'
            }), 400
        
        filename = file.filename
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        # 保存临时文件
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            content = ''
            
            # Word文档处理
            if ext in ['docx', 'doc']:
                try:
                    import docx
                    doc = docx.Document(temp_path)
                    content = '\n'.join([para.text for para in doc.paragraphs])
                except ImportError:
                    # 如果没有python-docx库，返回错误提示
                    return jsonify({
                        'success': False,
                        'error': 'Word文档解析需要安装python-docx库。请运行: pip install python-docx'
                    }), 500
                except Exception as e:
                    current_app.logger.error(f'Word文档解析失败: {str(e)}')
                    return jsonify({
                        'success': False,
                        'error': f'Word文档解析失败: {str(e)}'
                    }), 500
            else:
                # 文本文件直接读取
                with open(temp_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return jsonify({
                'success': True,
                'content': content,
                'filename': filename
            }), 200
            
        except Exception as e:
            # 确保清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
            
    except Exception as e:
        current_app.logger.error(f'文本提取失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'文本提取失败: {str(e)}'
        }), 500


@bp.route('/analyze-file', methods=['POST'])
@login_required
def analyze_file():
    """
    分析文件内容，提供任务完成时间估计和着手建议
    
    请求体:
        {
            "content": "文件内容（文本）",
            "file_type": "文件类型（可选，默认：text）",
            "filename": "文件名（可选）"
        }
    
    返回:
        {
            "success": true,
            "summary": "内容摘要",
            "estimated_hours": 预估小时数,
            "suggestions": ["建议1", "建议2", ...]
        }
    """
    try:
        data = request.json
        
        if not data or not data.get('content'):
            return jsonify({
                'success': False,
                'error': '请提供文件内容'
            }), 400
        
        content = data.get('content', '')
        file_type = data.get('file_type', 'text')
        filename = data.get('filename', '')
        
        # 记录请求信息（用于调试）
        current_app.logger.info(f'开始分析文件: {filename}, 类型: {file_type}, 内容长度: {len(content)}')
        
        # 不再限制内容长度，让AI处理完整内容
        # 如果内容过长，可以考虑分段处理，但现在先不限制
        
        # 调用AI分析
        current_app.logger.info('调用AI分析接口...')
        try:
            result = analyze_file_content(content, file_type)
            current_app.logger.info(f'AI分析结果: success={result.get("success")}')
            
            if result.get('success'):
                return jsonify(result), 200
            else:
                error_msg = result.get('error', '分析失败，请稍后重试')
                error_detail = result.get('raw', {})
                current_app.logger.error(f'AI分析失败: {error_msg}')
                current_app.logger.error(f'错误详情: {str(error_detail)[:500]}')
                # 返回详细的错误信息（前端可以看到）
                return jsonify({
                    'success': False,
                    'error': error_msg,
                    'detail': error_detail  # 包含原始API响应用于调试
                }), 500
        except Exception as api_error:
            import traceback
            error_detail = traceback.format_exc()
            current_app.logger.error(f'调用AI分析接口时发生异常: {str(api_error)}\n{error_detail}')
            return jsonify({
                'success': False,
                'error': f'AI分析接口调用异常: {str(api_error)}',
                'detail': error_detail[:500]
            }), 500
            
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        current_app.logger.error(f'文件分析异常: {str(e)}\n{error_detail}')
        return jsonify({
            'success': False,
            'error': f'分析失败: {str(e)}'
        }), 500


@bp.route('/test', methods=['GET'])
@login_required
def test():
    """
    测试端点：检查AI功能是否正常
    """
    try:
        from app.utils.xunfei_api import XunfeiAPI
        
        # 检查API配置
        api = XunfeiAPI()
        config_status = {
            'appid': '已配置' if api.appid else '未配置',
            'api_key': '已配置' if api.api_key else '未配置',
            'api_secret': '已配置' if api.api_secret else '未配置',
            'base_url': api.base_url
        }
        
        return jsonify({
            'success': True,
            'message': 'AI功能配置检查',
            'config': config_status
        }), 200
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        current_app.logger.error(f'AI测试异常: {str(e)}\n{error_detail}')
        return jsonify({
            'success': False,
            'error': f'测试失败: {str(e)}',
            'detail': error_detail[:500]
        }), 500


@bp.route('/daily-inspiration', methods=['GET'])
@login_required
def daily_inspiration():
    """
    获取每日激励语句和歌曲推荐
    
    返回:
        {
            "success": true,
            "motivation": "激励语句",
            "song": {
                "name": "歌曲名",
                "artist": "歌手名",
                "reason": "推荐理由"
            }
        }
    """
    try:
        result = get_daily_motivation_and_music()
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f'获取每日激励失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}',
            'motivation': '今天也要加油学习哦！💪',
            'song': {
                'name': '轻音乐推荐',
                'artist': 'Various Artists',
                'reason': '适合学习的背景音乐'
            }
        }), 500


@bp.route('/generate-plan', methods=['POST'])
@login_required
def generate_plan():
    """生成学习计划（暂未实现）"""
    return jsonify({
        'message': 'AI功能开发中',
        'plan': []
    }), 200


@bp.route('/prioritize-tasks', methods=['POST'])
@login_required
def prioritize_tasks():
    """任务优先级排序（暂未实现）"""
    return jsonify({
        'message': 'AI功能开发中',
        'tasks': []
    }), 200


@bp.route('/learning-advice', methods=['POST'])
@login_required
def learning_advice():
    """生成学习建议（暂未实现）"""
    return jsonify({
        'message': 'AI功能开发中',
        'advice': []
    }), 200


@bp.route('/break-down-goal', methods=['POST'])
@login_required
def break_down_goal():
    """
    学习目标拆解：将学习目标拆解为可执行步骤
    
    请求体:
        {
            "goal_description": "学习目标描述",
            "knowledge_background": "知识背景（可选）"
        }
    
    返回:
        {
            "success": true,
            "steps": [...],
            "learning_path": "..."
        }
    """
    try:
        data = request.json
        
        if not data or not data.get('goal_description'):
            return jsonify({
                'success': False,
                'error': '请提供学习目标描述'
            }), 400
        
        goal_description = data.get('goal_description', '')
        knowledge_background = data.get('knowledge_background', '')
        
        current_app.logger.info(f'开始拆解学习目标: {goal_description[:100]}')
        
        result = break_down_learning_goal(goal_description, knowledge_background)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', '拆解失败')
            }), 500
            
    except Exception as e:
        current_app.logger.error(f'学习目标拆解异常: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'拆解失败: {str(e)}'
        }), 500


@bp.route('/chat-sessions', methods=['GET'])
@login_required
def get_sessions():
    """
    获取用户的所有会话列表
    
    返回:
        {
            "success": true,
            "sessions": [会话列表]
        }
    """
    try:
        user_id = request.current_user_id
        
        sessions = AIChatSession.query.filter_by(user_id=user_id)\
            .order_by(AIChatSession.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取会话列表失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取会话列表失败: {str(e)}'
        }), 500


@bp.route('/chat-sessions', methods=['POST'])
@login_required
def create_session():
    """
    创建新会话
    
    请求体:
        {
            "title": "会话标题（可选，默认使用第一条消息）"
        }
    
    返回:
        {
            "success": true,
            "session": 会话信息
        }
    """
    try:
        data = request.json or {}
        user_id = request.current_user_id
        
        # 创建新会话
        session = AIChatSession(
            user_id=user_id,
            title=data.get('title', '新对话')
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'创建会话失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'创建会话失败: {str(e)}'
        }), 500


@bp.route('/chat-sessions/<int:session_id>', methods=['DELETE'])
@login_required
def delete_session(session_id):
    """
    删除会话及其所有消息
    
    参数:
        session_id: 会话ID
    
    返回:
        {
            "success": true
        }
    """
    try:
        user_id = request.current_user_id
        
        session = AIChatSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return jsonify({
                'success': False,
                'error': '会话不存在'
            }), 404
        
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'删除会话失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'删除会话失败: {str(e)}'
        }), 500


@bp.route('/chat', methods=['POST'])
@login_required
def chat():
    """
    AI学习伙伴：对话式答疑和情绪陪伴
    
    请求体:
        {
            "session_id": "会话ID（可选，不提供则使用当前会话或创建新会话）",
            "message": "用户消息",
            "conversation_history": [
                {"role": "user", "content": "..."},
                {"role": "assistant", "content": "..."}
            ]
        }
    
    返回:
        {
            "success": true,
            "reply": "AI回复内容"
        }
    """
    try:
        data = request.json
        user_id = request.current_user_id
        
        if not data or not data.get('message'):
            return jsonify({
                'success': False,
                'error': '请提供消息内容'
            }), 400
        
        message = data.get('message', '')
        session_id = data.get('session_id')
        conversation_history = data.get('conversation_history', [])
        
        current_app.logger.info(f'收到AI聊天消息: {message[:100]}')
        
        # 处理会话
        if not session_id:
            # 没有会话ID，创建新会话
            session = AIChatSession(
                user_id=user_id,
                title=message[:50]  # 使用第一条消息作为标题
            )
            db.session.add(session)
            db.session.flush()  # 获取session.id
            session_id = session.id
        else:
            # 验证会话存在且属于当前用户
            session = AIChatSession.query.filter_by(id=session_id, user_id=user_id).first()
            if not session:
                return jsonify({
                    'success': False,
                    'error': '会话不存在'
                }), 404
            
            # 更新会话标题（如果是第一条消息）
            if not session.title or session.title == '新对话':
                session.title = message[:50]
        
        # 保存用户消息到数据库
        user_msg = AIChatMessage(
            session_id=session_id,
            user_id=user_id,
            role='user',
            content=message
        )
        db.session.add(user_msg)
        
        result = chat_with_ai(message, conversation_history)
        
        # 保存AI回复到数据库
        if result.get('success') and result.get('reply'):
            ai_msg = AIChatMessage(
                session_id=session_id,
                user_id=user_id,
                role='assistant',
                content=result.get('reply')
            )
            db.session.add(ai_msg)
        
        # 更新会话时间
        session.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        if result.get('success'):
            # 在返回结果中添加session_id
            result['session_id'] = session_id
            return jsonify(result), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', '回复失败')
            }), 500
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'AI聊天异常: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'回复失败: {str(e)}'
        }), 500


@bp.route('/chat-history', methods=['GET'])
@login_required
def get_chat_history():
    """
    获取指定会话的聊天历史记录
    
    参数:
        session_id: 会话ID（可选，不提供则获取所有消息）
    
    返回:
        {
            "success": true,
            "messages": [...]
        }
    """
    try:
        user_id = request.current_user_id
        session_id = request.args.get('session_id')
        
        # 获取聊天记录
        if session_id:
            messages = AIChatMessage.query.filter_by(
                session_id=session_id, 
                user_id=user_id
            ).order_by(AIChatMessage.created_at.asc()).all()
        else:
            messages = AIChatMessage.query.filter_by(user_id=user_id)\
                .order_by(AIChatMessage.created_at.asc()).limit(100).all()
        
        return jsonify({
            'success': True,
            'messages': [msg.to_dict() for msg in messages]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取聊天历史失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取聊天历史失败: {str(e)}'
        }), 500


@bp.route('/chat-history/<int:message_id>', methods=['DELETE'])
@login_required
def delete_chat_message(message_id):
    """
    删除指定的聊天消息
    
    参数:
        message_id: 消息ID
    
    返回:
        {
            "success": true,
            "message": "删除成功"
        }
    """
    try:
        user_id = request.current_user_id
        
        # 查找消息
        msg = AIChatMessage.query.filter_by(id=message_id, user_id=user_id).first()
        
        if not msg:
            return jsonify({
                'success': False,
                'error': '消息不存在'
            }), 404
        
        # 删除消息
        db.session.delete(msg)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '删除成功'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'删除消息失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'删除失败: {str(e)}'
        }), 500


@bp.route('/chat-history', methods=['DELETE'])
@login_required
def clear_chat_history():
    """
    清空所有聊天历史记录（删除所有会话）
    
    返回:
        {
            "success": true,
            "message": "清空成功"
        }
    """
    try:
        user_id = request.current_user_id
        
        # 删除用户的所有会话（级联删除消息）
        AIChatSession.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '清空成功'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'清空聊天历史失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'清空失败: {str(e)}'
        }), 500
