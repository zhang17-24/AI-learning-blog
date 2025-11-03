"""
课程模型
"""
from datetime import datetime, time
from app.models import db


class Course(db.Model):
    """课程模型"""
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    course_name = db.Column(db.String(100), nullable=False)
    instructor = db.Column(db.String(50))
    location = db.Column(db.String(100))
    day_of_week = db.Column(db.Integer, nullable=False)  # 0-6 (周日-周六)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    assignments = db.relationship('Assignment', backref='course', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_name': self.course_name,
            'instructor': self.instructor,
            'location': self.location,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if isinstance(self.start_time, time) else self.start_time,
            'end_time': self.end_time.strftime('%H:%M') if isinstance(self.end_time, time) else self.end_time,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<Course {self.course_name}>'

