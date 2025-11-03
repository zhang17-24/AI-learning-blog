"""
项目管理路由 - Git for Learning协作系统
"""
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.project import Project, ProjectFile
from app.models.group import Group, GroupMember
from app.utils.auth import login_required
import os
import hashlib

bp = Blueprint('projects', __name__)


def verify_group_member(group_id, user_id):
    """
    验证用户是否是小组成员
    
    Args:
        group_id: 小组ID
        user_id: 用户ID
        
    Returns:
        GroupMember对象或None
    """
    return GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()


def generate_commit_hash(message, timestamp):
    """
    生成提交哈希值
    
    Args:
        message: 提交信息
        timestamp: 时间戳
        
    Returns:
        哈希值字符串
    """
    content = f"{message}{timestamp}".encode('utf-8')
    return hashlib.sha256(content).hexdigest()


@bp.route('/groups/<int:group_id>/projects', methods=['GET', 'POST'])
@login_required
def group_projects(group_id):
    """获取小组项目列表或创建新项目"""
    user = request.current_user
    
    # 验证用户是否是成员
    member = verify_group_member(group_id, user.id)
    if not member:
        return jsonify({'error': '无权访问该小组'}), 403
    
    if request.method == 'GET':
        try:
            # 获取小组的所有项目
            projects = Project.query.filter_by(group_id=group_id).all()
            return jsonify({
                'projects': [p.to_dict() for p in projects]
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'POST':
        try:
            data = request.json
            
            # 验证必填字段
            if not data or not data.get('name'):
                return jsonify({'error': '缺少必要字段：name'}), 400
            
            # 创建新项目
            project = Project(
                group_id=group_id,
                name=data['name'],
                description=data.get('description'),
                creator_id=user.id
            )
            
            db.session.add(project)
            db.session.commit()
            
            return jsonify({
                'message': '项目创建成功',
                'project': project.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'创建项目失败: {str(e)}'}), 500


@bp.route('/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def project_detail(project_id):
    """获取、更新或删除项目"""
    user = request.current_user
    
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': '项目不存在'}), 404
        
        # 验证用户是否是小组成员
        member = verify_group_member(project.group_id, user.id)
        if not member:
            return jsonify({'error': '无权访问该项目'}), 403
        
        if request.method == 'GET':
            return jsonify({'project': project.to_dict()}), 200
        
        if request.method == 'PUT':
            data = request.json
            
            # 更新字段
            if 'name' in data:
                project.name = data['name']
            if 'description' in data:
                project.description = data.get('description')
            
            db.session.commit()
            
            return jsonify({
                'message': '项目更新成功',
                'project': project.to_dict()
            }), 200
        
        if request.method == 'DELETE':
            # 只有创建者或管理员可以删除
            if project.creator_id != user.id and member.role != 'admin':
                return jsonify({'error': '无权限删除该项目'}), 403
            
            db.session.delete(project)
            db.session.commit()
            
            return jsonify({'message': '项目删除成功'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:project_id>/files', methods=['GET', 'POST'])
@login_required
def project_files(project_id):
    """获取项目文件列表或上传/创建文件"""
    user = request.current_user
    
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': '项目不存在'}), 404
        
        # 验证用户是否是小组成员
        member = verify_group_member(project.group_id, user.id)
        if not member:
            return jsonify({'error': '无权访问该项目'}), 403
        
        if request.method == 'GET':
            files = ProjectFile.query.filter_by(project_id=project_id).all()
            return jsonify({
                'files': [f.to_dict() for f in files]
            }), 200
        
        if request.method == 'POST':
            data = request.json
            
            # 支持两种方式：直接创建文本文件或上传文件
            if 'filename' in request.form and 'file' in request.files:
                # 处理文件上传
                file = request.files['file']
                if file.filename == '':
                    return jsonify({'error': '未选择文件'}), 400
                
                filename = file.filename
                content = file.read().decode('utf-8', errors='ignore')
                
                # 保存文件到磁盘（可选）
                upload_folder = request.app.config.get('UPLOAD_FOLDER')
                if upload_folder:
                    project_folder = os.path.join(upload_folder, 'projects', str(project_id))
                    os.makedirs(project_folder, exist_ok=True)
                    
                    file_path = os.path.join(project_folder, filename)
                    with open(file_path, 'wb') as f:
                        f.write(file.read())
                else:
                    file_path = None
                
                project_file = ProjectFile(
                    project_id=project_id,
                    filename=filename,
                    content=content,
                    file_path=file_path,
                    file_type=file.content_type,
                    file_size=len(content),
                    creator_id=user.id
                )
            else:
                # 直接创建文本文件
                if not data or not data.get('filename') or not data.get('content'):
                    return jsonify({'error': '缺少必要字段：filename, content'}), 400
                
                project_file = ProjectFile(
                    project_id=project_id,
                    filename=data['filename'],
                    content=data['content'],
                    file_type=data.get('file_type', 'text/plain'),
                    file_size=len(data['content']),
                    creator_id=user.id
                )
            
            db.session.add(project_file)
            db.session.commit()
            
            return jsonify({
                'message': '文件创建成功',
                'file': project_file.to_dict()
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:project_id>/files/<int:file_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def project_file_detail(project_id, file_id):
    """获取、更新或删除项目文件"""
    user = request.current_user
    
    try:
        project_file = ProjectFile.query.get(file_id)
        if not project_file:
            return jsonify({'error': '文件不存在'}), 404
        
        if project_file.project_id != project_id:
            return jsonify({'error': '文件不属于该项目'}), 400
        
        # 验证用户是否是小组成员
        project = Project.query.get(project_id)
        member = verify_group_member(project.group_id, user.id)
        if not member:
            return jsonify({'error': '无权访问该文件'}), 403
        
        if request.method == 'GET':
            return jsonify({'file': project_file.to_dict()}), 200
        
        if request.method == 'PUT':
            data = request.json
            
            # 更新字段
            if 'content' in data:
                project_file.content = data['content']
                project_file.file_size = len(data['content'])
            if 'filename' in data:
                project_file.filename = data['filename']
            
            db.session.commit()
            
            return jsonify({
                'message': '文件更新成功',
                'file': project_file.to_dict()
            }), 200
        
        if request.method == 'DELETE':
            # 删除文件物理文件（如果存在）
            if project_file.file_path and os.path.exists(project_file.file_path):
                os.remove(project_file.file_path)
            
            db.session.delete(project_file)
            db.session.commit()
            
            return jsonify({'message': '文件删除成功'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:project_id>/commits', methods=['GET', 'POST'])
@login_required
def project_commits(project_id):
    """获取提交历史或创建新提交"""
    user = request.current_user
    
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': '项目不存在'}), 404
        
        # 验证用户是否是小组成员
        member = verify_group_member(project.group_id, user.id)
        if not member:
            return jsonify({'error': '无权访问该项目'}), 403
        
        if request.method == 'GET':
            from app.models.commit import Commit
            commits = Commit.query.filter_by(project_id=project_id).order_by(Commit.created_at.desc()).all()
            return jsonify({
                'commits': [c.to_dict() for c in commits]
            }), 200
        
        if request.method == 'POST':
            from app.models.commit import Commit, FileChange
            data = request.json
            
            # 验证必填字段
            if not data or not data.get('message'):
                return jsonify({'error': '缺少必要字段：message'}), 400
            
            # 生成提交哈希
            from datetime import datetime
            timestamp = datetime.utcnow().isoformat()
            commit_hash = generate_commit_hash(data['message'], timestamp)
            
            # 创建提交
            commit = Commit(
                project_id=project_id,
                committer_id=user.id,
                message=data['message'],
                hash=commit_hash
            )
            
            db.session.add(commit)
            db.session.flush()  # 获取commit.id
            
            # 记录文件变更（如果有）
            file_changes = data.get('file_changes', [])
            for fc_data in file_changes:
                file_change = FileChange(
                    commit_id=commit.id,
                    file_id=fc_data['file_id'],
                    change_type=fc_data.get('change_type', 'modify'),
                    diff_content=fc_data.get('diff_content')
                )
                db.session.add(file_change)
            
            db.session.commit()
            
            return jsonify({
                'message': '提交创建成功',
                'commit': commit.to_dict()
            }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

