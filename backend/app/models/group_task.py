"""
小组任务模型
"""
from datetime import datetime
from app.models import db


class GroupTask(db.Model):
    """小组任务模型"""
    __tablename__ = 'group_tasks'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False, index=True)
    assigner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending', index=True)  # pending, in_progress, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    assigner = db.relationship('User', foreign_keys=[assigner_id])
    assignee = db.relationship('User', foreign_keys=[assignee_id])
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'group_id': self.group_id,
            'assigner_id': self.assigner_id,
            'assignee_id': self.assignee_id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<GroupTask {self.title}>'

