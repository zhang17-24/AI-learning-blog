"""
作业模型
"""
from datetime import datetime
from app.models import db


class Assignment(db.Model):
    """作业模型"""
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), index=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False, index=True)
    priority = db.Column(db.String(20), default='medium', index=True)  # low, medium, high
    status = db.Column(db.String(20), default='pending', index=True)  # pending, in_progress, completed
    # 提醒相关字段
    reminder_enabled = db.Column(db.Boolean, default=False)  # 是否启用提醒
    reminder_datetime = db.Column(db.DateTime, index=True)  # 提醒时间
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    files = db.relationship('AssignmentFile', backref='assignment', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'priority': self.priority,
            'status': self.status,
            'reminder_enabled': self.reminder_enabled,
            'reminder_datetime': self.reminder_datetime.isoformat() if self.reminder_datetime else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'files': [file.to_dict() for file in self.files] if self.files else [],
        }
    
    def __repr__(self):
        return f'<Assignment {self.title}>'

