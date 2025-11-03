"""
作业管理路由
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from app.models import db
from app.models.assignment import Assignment
from app.models.assignment_file import AssignmentFile
from app.utils.auth import login_required
import os
import uuid
from werkzeug.utils import secure_filename

bp = Blueprint('assignments', __name__)

# 允许上传的文件类型
ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'},
    'document': {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'},
    'other': {'zip', 'rar', '7z', 'tar', 'gz'}
}

ALLOWED_EXTENSIONS_FLAT = set()
for category in ALLOWED_EXTENSIONS.values():
    ALLOWED_EXTENSIONS_FLAT.update(category)


def allowed_file(filename):
    """
    检查文件扩展名是否允许
    
    Args:
        filename: 文件名
        
    Returns:
        tuple: (是否允许, 文件分类)
    """
    if '.' not in filename:
        return False, None
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS_FLAT:
        return False, None
    
    # 判断文件分类
    for category, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return True, category
    
    return False, None


def get_file_category(filename):
    """根据文件名获取文件分类"""
    _, category = allowed_file(filename)
    return category or 'other'


@bp.route('', methods=['GET', 'POST'])
@login_required
def assignments():
    """获取作业列表或创建新作业"""
    user = request.current_user
    
    if request.method == 'GET':
        try:
            # 获取查询参数
            status = request.args.get('status')  # pending, in_progress, completed
            priority = request.args.get('priority')  # low, medium, high
            course_id = request.args.get('course_id', type=int)
            sort_by = request.args.get('sort_by', 'due_date')  # due_date, created_at, priority
            order = request.args.get('order', 'asc')  # asc, desc
            
            # 构建查询
            query = Assignment.query.filter_by(user_id=user.id)
            
            # 应用过滤器
            if status:
                query = query.filter_by(status=status)
            if priority:
                query = query.filter_by(priority=priority)
            if course_id:
                query = query.filter_by(course_id=course_id)
            
            # 应用排序
            if sort_by == 'due_date':
                order_by = Assignment.due_date.asc() if order == 'asc' else Assignment.due_date.desc()
            elif sort_by == 'created_at':
                order_by = Assignment.created_at.asc() if order == 'asc' else Assignment.created_at.desc()
            elif sort_by == 'priority':
                # 优先级排序：high > medium > low
                priority_order = {'high': 3, 'medium': 2, 'low': 1}
                query = query.order_by(
                    db.case(
                        (Assignment.priority == 'high', 3),
                        (Assignment.priority == 'medium', 2),
                        (Assignment.priority == 'low', 1),
                        else_=0
                    ).desc() if order == 'desc' else db.case(
                        (Assignment.priority == 'high', 3),
                        (Assignment.priority == 'medium', 2),
                        (Assignment.priority == 'low', 1),
                        else_=0
                    ).asc()
                )
                assignments_list = query.all()
                return jsonify({
                    'assignments': [assignment.to_dict() for assignment in assignments_list]
                }), 200
            else:
                order_by = Assignment.due_date.asc()
            
            query = query.order_by(order_by)
            assignments_list = query.all()
            
            return jsonify({
                'assignments': [assignment.to_dict() for assignment in assignments_list]
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'获取作业列表失败: {str(e)}'}), 500
    
    if request.method == 'POST':
        try:
            data = request.json
            
            # 验证必填字段
            required_fields = ['title', 'due_date']
            if not data or not all(data.get(field) for field in required_fields):
                return jsonify({'error': '缺少必要字段：title, due_date'}), 400
            
            # 解析截止日期
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return jsonify({'error': '无效的日期格式，请使用ISO格式（如：2024-01-01T12:00:00）'}), 400
            
            # 解析提醒时间（如果提供）
            reminder_datetime = None
            if data.get('reminder_enabled') and data.get('reminder_datetime'):
                try:
                    reminder_datetime = datetime.fromisoformat(data['reminder_datetime'].replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    return jsonify({'error': '无效的提醒时间格式'}), 400
            
            # 创建新作业
            assignment = Assignment(
                user_id=user.id,
                course_id=data.get('course_id'),
                title=data['title'],
                description=data.get('description', ''),
                due_date=due_date,
                priority=data.get('priority', 'medium'),
                status=data.get('status', 'pending'),
                reminder_enabled=data.get('reminder_enabled', False),
                reminder_datetime=reminder_datetime
            )
            
            db.session.add(assignment)
            db.session.commit()
            
            return jsonify({
                'message': '作业创建成功',
                'assignment': assignment.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'创建作业失败: {str(e)}'}), 500


@bp.route('/<int:assignment_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def assignment_detail(assignment_id):
    """获取、更新或删除作业"""
    user = request.current_user
    
    try:
        assignment = Assignment.query.filter_by(id=assignment_id, user_id=user.id).first()
        
        if not assignment:
            return jsonify({'error': '作业不存在或无权限访问'}), 404
        
        if request.method == 'GET':
            return jsonify({'assignment': assignment.to_dict()}), 200
        
        if request.method == 'PUT':
            data = request.json
            
            # 更新字段
            if 'title' in data:
                assignment.title = data['title']
            if 'description' in data:
                assignment.description = data.get('description', '')
            if 'due_date' in data:
                try:
                    assignment.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    return jsonify({'error': '无效的日期格式'}), 400
            if 'priority' in data:
                if data['priority'] in ['low', 'medium', 'high']:
                    assignment.priority = data['priority']
                else:
                    return jsonify({'error': '优先级必须是 low, medium 或 high'}), 400
            if 'status' in data:
                if data['status'] in ['pending', 'in_progress', 'completed']:
                    assignment.status = data['status']
                else:
                    return jsonify({'error': '状态必须是 pending, in_progress 或 completed'}), 400
            if 'course_id' in data:
                assignment.course_id = data.get('course_id')
            
            # 更新提醒设置
            if 'reminder_enabled' in data:
                assignment.reminder_enabled = bool(data['reminder_enabled'])
            if 'reminder_datetime' in data:
                if data.get('reminder_datetime'):
                    try:
                        assignment.reminder_datetime = datetime.fromisoformat(
                            data['reminder_datetime'].replace('Z', '+00:00')
                        )
                    except (ValueError, AttributeError):
                        return jsonify({'error': '无效的提醒时间格式'}), 400
                else:
                    assignment.reminder_datetime = None
            
            assignment.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': '作业更新成功',
                'assignment': assignment.to_dict()
            }), 200
        
        if request.method == 'DELETE':
            # 删除关联的文件
            for file in assignment.files:
                file.delete_file()
            
            db.session.delete(assignment)
            db.session.commit()
            
            return jsonify({'message': '作业删除成功'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'操作失败: {str(e)}'}), 500


@bp.route('/<int:assignment_id>/files', methods=['POST'])
@login_required
def upload_file(assignment_id):
    """上传作业文件"""
    user = request.current_user
    
    try:
        assignment = Assignment.query.filter_by(id=assignment_id, user_id=user.id).first()
        if not assignment:
            return jsonify({'error': '作业不存在或无权限访问'}), 404
        
        # 检查是否有文件
        if 'file' not in request.files:
            return jsonify({'error': '未选择文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '未选择文件'}), 400
        
        # 检查文件类型
        is_allowed, category = allowed_file(file.filename)
        if not is_allowed:
            return jsonify({
                'error': f'不支持的文件类型。允许的类型：图片（png, jpg, jpeg, gif等）、文档（pdf, doc, docx等）、压缩包（zip, rar等）'
            }), 400
        
        # 确保上传目录存在
        upload_folder = current_app.config['UPLOAD_FOLDER']
        assignment_folder = os.path.join(upload_folder, 'assignments', str(assignment_id))
        os.makedirs(assignment_folder, exist_ok=True)
        
        # 生成唯一文件名
        filename = secure_filename(file.filename)
        file_ext = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = os.path.join(assignment_folder, unique_filename)
        
        # 保存文件
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        # 获取MIME类型
        from mimetypes import guess_type
        file_type, _ = guess_type(filename)
        if not file_type:
            file_type = f'application/{file_ext}'
        
        # 创建文件记录
        assignment_file = AssignmentFile(
            assignment_id=assignment.id,
            user_id=user.id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            file_category=category
        )
        
        db.session.add(assignment_file)
        db.session.commit()
        
        return jsonify({
            'message': '文件上传成功',
            'file': assignment_file.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'文件上传失败: {str(e)}'}), 500


@bp.route('/<int:assignment_id>/files/<int:file_id>', methods=['DELETE'])
@login_required
def delete_file(assignment_id, file_id):
    """删除作业文件"""
    user = request.current_user
    
    try:
        assignment = Assignment.query.filter_by(id=assignment_id, user_id=user.id).first()
        if not assignment:
            return jsonify({'error': '作业不存在或无权限访问'}), 404
        
        assignment_file = AssignmentFile.query.filter_by(
            id=file_id,
            assignment_id=assignment_id,
            user_id=user.id
        ).first()
        
        if not assignment_file:
            return jsonify({'error': '文件不存在或无权限访问'}), 404
        
        # 删除物理文件
        assignment_file.delete_file()
        
        # 删除数据库记录
        db.session.delete(assignment_file)
        db.session.commit()
        
        return jsonify({'message': '文件删除成功'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'文件删除失败: {str(e)}'}), 500


@bp.route('/<int:assignment_id>/files', methods=['GET'])
@login_required
def get_files(assignment_id):
    """获取作业的所有文件"""
    user = request.current_user
    
    try:
        assignment = Assignment.query.filter_by(id=assignment_id, user_id=user.id).first()
        if not assignment:
            return jsonify({'error': '作业不存在或无权限访问'}), 404
        
        files = AssignmentFile.query.filter_by(assignment_id=assignment_id).all()
        
        return jsonify({
            'files': [f.to_dict() for f in files]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取文件列表失败: {str(e)}'}), 500


@bp.route('/<int:assignment_id>/files/<int:file_id>/download', methods=['GET'])
@login_required
def download_file(assignment_id, file_id):
    """下载作业文件"""
    from flask import send_file
    
    user = request.current_user
    
    try:
        assignment = Assignment.query.filter_by(id=assignment_id, user_id=user.id).first()
        if not assignment:
            return jsonify({'error': '作业不存在或无权限访问'}), 404
        
        assignment_file = AssignmentFile.query.filter_by(
            id=file_id,
            assignment_id=assignment_id,
            user_id=user.id
        ).first()
        
        if not assignment_file:
            return jsonify({'error': '文件不存在或无权限访问'}), 404
        
        if not os.path.exists(assignment_file.file_path):
            return jsonify({'error': '文件不存在'}), 404
        
        return send_file(
            assignment_file.file_path,
            as_attachment=True,
            download_name=assignment_file.filename
        )
        
    except Exception as e:
        return jsonify({'error': f'文件下载失败: {str(e)}'}), 500
