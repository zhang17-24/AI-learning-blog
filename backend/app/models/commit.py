"""
提交历史模型 - Git for Learning协作系统
"""
from datetime import datetime
from app.models import db


class Commit(db.Model):
    """提交历史模型"""
    __tablename__ = 'commits'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    committer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)  # 提交信息
    hash = db.Column(db.String(64), unique=True, index=True)  # 提交哈希值
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # 关联关系
    committer = db.relationship('User')
    file_changes = db.relationship('FileChange', backref='commit', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'committer_id': self.committer_id,
            'message': self.message,
            'hash': self.hash,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'committer': self.committer.to_dict() if self.committer else None,
            'file_changes': [fc.to_dict() for fc in self.file_changes],
        }
    
    def __repr__(self):
        return f'<Commit {self.hash[:8]}...>'


class FileChange(db.Model):
    """文件变更记录模型"""
    __tablename__ = 'file_changes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    commit_id = db.Column(db.Integer, db.ForeignKey('commits.id'), nullable=False, index=True)
    file_id = db.Column(db.Integer, db.ForeignKey('project_files.id'), nullable=False)
    change_type = db.Column(db.String(20), nullable=False)  # add, modify, delete
    diff_content = db.Column(db.Text)  # 变更内容或差异
    
    # 关联关系
    file = db.relationship('ProjectFile')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'commit_id': self.commit_id,
            'file_id': self.file_id,
            'change_type': self.change_type,
            'diff_content': self.diff_content,
            'file': self.file.to_dict() if self.file else None,
        }
    
    def __repr__(self):
        return f'<FileChange {self.change_type} in commit {self.commit_id}>'

