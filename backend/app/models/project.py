"""
项目模型 - Git for Learning协作系统
"""
from datetime import datetime
from app.models import db


class Project(db.Model):
    """项目模型"""
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    creator = db.relationship('User')
    files = db.relationship('ProjectFile', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    commits = db.relationship('Commit', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'group_id': self.group_id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'file_count': self.files.count(),
            'commit_count': self.commits.count(),
        }
    
    def __repr__(self):
        return f'<Project {self.name}>'


class ProjectFile(db.Model):
    """项目文件模型"""
    __tablename__ = 'project_files'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text)  # 文件内容
    file_path = db.Column(db.String(500))  # 上传文件的路径（可选）
    file_type = db.Column(db.String(50))  # 文件类型（如：text, image, document等）
    file_size = db.Column(db.BigInteger)  # 文件大小（字节）
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    creator = db.relationship('User')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'filename': self.filename,
            'content': self.content,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'creator_id': self.creator_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<ProjectFile {self.filename}>'

