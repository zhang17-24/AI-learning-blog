"""
消息模型
"""
from datetime import datetime
from app.models import db


class Message(db.Model):
    """消息模型"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default='text')  # text, file, image
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # 关联关系
    sender = db.relationship('User')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'group_id': self.group_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'message_type': self.message_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender': self.sender.to_dict() if self.sender else None,
        }
    
    def __repr__(self):
        return f'<Message {self.id} from {self.sender_id}>'

