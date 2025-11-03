"""
学习计划模型
"""
from datetime import datetime
from app.models import db
from sqlalchemy import Numeric


class StudyPlan(db.Model):
    """学习计划模型"""
    __tablename__ = 'study_plans'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    target_hours = db.Column(Numeric(10, 2), default=0)
    completed_hours = db.Column(Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'target_hours': float(self.target_hours) if self.target_hours else 0,
            'completed_hours': float(self.completed_hours) if self.completed_hours else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<StudyPlan {self.title}>'

