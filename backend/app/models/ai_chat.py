"""
AI聊天记录模型
"""
from datetime import datetime
from app.models import db


class AIChatSession(db.Model):
    """AI聊天会话模型"""
    __tablename__ = 'ai_chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(100), nullable=False)  # 会话标题（第一条用户消息）
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    # 关联关系
    user = db.relationship('User', backref='ai_chat_sessions')
    messages = db.relationship('AIChatMessage', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<AIChatSession {self.id}: {self.title}>'


class AIChatMessage(db.Model):
    """AI聊天消息模型"""
    __tablename__ = 'ai_chat_messages'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.Integer, db.ForeignKey('ai_chat_sessions.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)  # user 或 assistant
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # 关联关系
    user = db.relationship('User', backref='ai_chat_messages')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<AIChatMessage {self.id} from {self.user_id}>'

