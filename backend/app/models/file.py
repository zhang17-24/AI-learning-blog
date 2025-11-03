"""
文件模型
"""
from datetime import datetime
from app.models import db


class File(db.Model):
    """文件模型"""
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False, index=True)
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.BigInteger)  # 文件大小（字节）
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    uploader = db.relationship('User')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'group_id': self.group_id,
            'uploader_id': self.uploader_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'uploader': self.uploader.to_dict() if self.uploader else None,
        }
    
    def __repr__(self):
        return f'<File {self.filename}>'

