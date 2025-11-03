"""
消息提醒模型
"""
from datetime import datetime
from app.models import db


class Notification(db.Model):
    """消息提醒模型"""
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, index=True)  # assignment, study_time, group
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)
    link = db.Column(db.String(500))  # 点击后跳转的链接
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # 关联关系
    user = db.relationship('User', foreign_keys=[user_id])
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'content': self.content,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<Notification {self.id} for user {self.user_id}>'
