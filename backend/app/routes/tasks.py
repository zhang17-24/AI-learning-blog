"""
任务管理路由 - Git for Learning协作系统
"""
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.group_task import GroupTask
from app.models.group import Group, GroupMember
from app.utils.auth import login_required

bp = Blueprint('tasks', __name__)


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


@bp.route('/projects/<int:project_id>/tasks', methods=['GET', 'POST'])
@login_required
def project_tasks(project_id):
    """获取项目任务列表或创建新任务"""
    user = request.current_user
    
    # 获取项目信息以获取group_id
    from app.models.project import Project
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': '项目不存在'}), 404
    
    # 验证用户是否是小组成员
    member = verify_group_member(project.group_id, user.id)
    if not member:
        return jsonify({'error': '无权访问该项目'}), 403
    
    if request.method == 'GET':
        try:
            # 获取项目的所有任务（通过group_id查找）
            tasks = GroupTask.query.filter_by(group_id=project.group_id).all()
            return jsonify({
                'tasks': [t.to_dict() for t in tasks]
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'POST':
        try:
            data = request.json
            
            # 验证必填字段
            if not data or not data.get('title'):
                return jsonify({'error': '缺少必要字段：title'}), 400
            if not data.get('due_date'):
                return jsonify({'error': '缺少必要字段：due_date'}), 400
            
            # 创建新任务
            task = GroupTask(
                group_id=project.group_id,
                assigner_id=user.id,
                assignee_id=data.get('assignee_id'),
                title=data['title'],
                description=data.get('description'),
                due_date=data['due_date'],
                status=data.get('status', 'pending')
            )
            
            db.session.add(task)
            db.session.commit()
            
            return jsonify({
                'message': '任务创建成功',
                'task': task.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'创建任务失败: {str(e)}'}), 500


@bp.route('/projects/<int:project_id>/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
@login_required
def project_task_detail(project_id, task_id):
    """更新或删除任务"""
    user = request.current_user
    
    try:
        task = GroupTask.query.get(task_id)
        if not task:
            return jsonify({'error': '任务不存在'}), 404
        
        # 获取项目信息以验证group_id
        from app.models.project import Project
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': '项目不存在'}), 404
        
        if task.group_id != project.group_id:
            return jsonify({'error': '任务不属于该项目'}), 400
        
        # 验证用户是否是小组成员
        member = verify_group_member(project.group_id, user.id)
        if not member:
            return jsonify({'error': '无权访问该任务'}), 403
        
        if request.method == 'PUT':
            data = request.json
            
            # 更新字段
            if 'title' in data:
                task.title = data['title']
            if 'description' in data:
                task.description = data.get('description')
            if 'due_date' in data:
                task.due_date = data['due_date']
            if 'status' in data:
                task.status = data['status']
            if 'assignee_id' in data:
                task.assignee_id = data.get('assignee_id')
            
            db.session.commit()
            
            return jsonify({
                'message': '任务更新成功',
                'task': task.to_dict()
            }), 200
        
        if request.method == 'DELETE':
            # 只有创建者或管理员可以删除
            if task.assigner_id != user.id and member.role != 'admin':
                return jsonify({'error': '无权限删除该任务'}), 403
            
            db.session.delete(task)
            db.session.commit()
            
            return jsonify({'message': '任务删除成功'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

