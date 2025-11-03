"""
写作空间模型
"""
from datetime import datetime
from app.models import db


class WritingItem(db.Model):
    """写作空间项目模型"""
    __tablename__ = 'writing_items'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('writing_sessions.id'), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)  # 文档标题
    content = db.Column(db.Text)  # 文档内容
    item_type = db.Column(db.String(20), nullable=False, default='text')  # text 或 image
    position_x = db.Column(db.Integer, default=100)
    position_y = db.Column(db.Integer, default=100)
    width = db.Column(db.Integer, default=400)
    height = db.Column(db.Integer, default=300)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    user = db.relationship('User', backref='writing_items')
    session = db.relationship('WritingSession', backref='items')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'title': self.title,
            'content': self.content,
            'item_type': self.item_type,
            'position_x': self.position_x,
            'position_y': self.position_y,
            'width': self.width,
            'height': self.height,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<WritingItem {self.id}: {self.title}>'


class WritingSession(db.Model):
    """写作空间会话模型"""
    __tablename__ = 'writing_sessions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, default='未命名文档')  # 会话名称
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    # 关联关系
    user = db.relationship('User', backref='writing_sessions')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<WritingSession {self.id}: {self.name}>'

