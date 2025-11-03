"""
小组模型
"""
from datetime import datetime
from app.models import db


class Group(db.Model):
    """小组模型"""
    __tablename__ = 'groups'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    join_key = db.Column(db.String(32), unique=True, index=True)  # 加入密钥
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    creator = db.relationship('User', foreign_keys=[creator_id])
    members = db.relationship('GroupMember', backref='group', lazy='dynamic', cascade='all, delete-orphan')
    tasks = db.relationship('GroupTask', backref='group', lazy='dynamic', cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='group', lazy='dynamic', cascade='all, delete-orphan')
    files = db.relationship('File', backref='group', lazy='dynamic', cascade='all, delete-orphan')
    projects = db.relationship('Project', backref='group', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'join_key': self.join_key,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'member_count': self.members.count(),
        }
    
    def __repr__(self):
        return f'<Group {self.name}>'


class GroupMember(db.Model):
    """小组成员模型"""
    __tablename__ = 'group_members'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    role = db.Column(db.String(20), default='member')  # member, admin
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    user = db.relationship('User')
    
    # 唯一约束：一个用户在一个小组中只能有一条记录
    __table_args__ = (db.UniqueConstraint('group_id', 'user_id', name='_group_user_uc'),)
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'group_id': self.group_id,
            'user_id': self.user_id,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'user': self.user.to_dict() if self.user else None,
        }
    
    def __repr__(self):
        return f'<GroupMember {self.user_id} in group {self.group_id}>'

