"""
作业文件模型
"""
from datetime import datetime
from app.models import db
import os


class AssignmentFile(db.Model):
    """作业文件模型，用于存储作业关联的文件"""
    __tablename__ = 'assignment_files'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)  # 原始文件名
    file_path = db.Column(db.String(500), nullable=False)  # 服务器存储路径
    file_size = db.Column(db.BigInteger)  # 文件大小（字节）
    file_type = db.Column(db.String(50))  # 文件类型（MIME类型，如image/jpeg, application/pdf等）
    file_category = db.Column(db.String(20))  # 文件分类：image, document, other
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    user = db.relationship('User')
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'file_category': self.file_category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def delete_file(self):
        """
        删除服务器上的物理文件
        
        注意：调用此方法后需要手动提交数据库事务
        """
        try:
            if os.path.exists(self.file_path):
                os.remove(self.file_path)
                return True
        except Exception as e:
            # 记录错误但不抛出异常，避免影响数据库操作
            print(f'删除文件失败: {self.file_path}, 错误: {str(e)}')
            return False
        return False
    
    def __repr__(self):
        return f'<AssignmentFile {self.filename}>'

