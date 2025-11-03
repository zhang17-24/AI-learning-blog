"""
WebSocket路由 - 小组聊天功能
"""
from flask import Blueprint
from flask_socketio import emit, join_room, leave_room
from app.models import db
from app.models.message import Message

bp = Blueprint('ws', __name__)


def register_socketio_events(socketio):
    """
    注册SocketIO事件
    
    Args:
        socketio: SocketIO实例
    """
    
    @socketio.on('connect')
    def handle_connect():
        """客户端连接"""
        print('Client connected')
        emit('connected', {'msg': 'Connected to server'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """客户端断开"""
        print('Client disconnected')
    
    @socketio.on('join_group')
    def handle_join_group(data):
        """加入小组聊天室"""
        group_id = data.get('group_id')
        if group_id:
            join_room(f'group_{group_id}')
            emit('joined_group', {'group_id': group_id})
            
            # 发送最近的消息历史（可选）
            try:
                recent_messages = Message.query.filter_by(
                    group_id=group_id
                ).order_by(Message.created_at.desc()).limit(50).all()
                
                messages = [msg.to_dict() for msg in recent_messages[::-1]]  # 反转顺序
                emit('message_history', {'messages': messages})
            except Exception as e:
                print(f'Error loading message history: {e}')
    
    @socketio.on('leave_group')
    def handle_leave_group(data):
        """离开小组聊天室"""
        group_id = data.get('group_id')
        if group_id:
            leave_room(f'group_{group_id}')
            emit('left_group', {'group_id': group_id})
    
    @socketio.on('send_message')
    def handle_send_message(data):
        """发送消息"""
        group_id = data.get('group_id')
        content = data.get('content')
        sender_id = data.get('sender_id')
        message_type = data.get('message_type', 'text')
        
        if group_id and content and sender_id:
            try:
                # 保存消息到数据库
                message = Message(
                    group_id=group_id,
                    sender_id=sender_id,
                    content=content,
                    message_type=message_type
                )
                db.session.add(message)
                db.session.commit()
                
                # 广播消息给房间内所有用户
                emit('new_message', message.to_dict(), room=f'group_{group_id}')
                
            except Exception as e:
                print(f'Error saving message: {e}')
                db.session.rollback()
                emit('error', {'error': '发送消息失败'})

