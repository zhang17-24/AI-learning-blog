"""
小组管理路由
"""
import secrets
from flask import Blueprint, request, jsonify
from app.models import db
from app.models.group import Group, GroupMember
from app.utils.auth import login_required

bp = Blueprint('groups', __name__)


def generate_join_key():
    """生成加入密钥"""
    return secrets.token_hex(16)


@bp.route('', methods=['GET', 'POST'])
@login_required
def groups():
    """获取小组列表或创建新小组"""
    user = request.current_user
    
    if request.method == 'GET':
        try:
            # 获取用户所在的所有小组
            member_relations = GroupMember.query.filter_by(user_id=user.id).all()
            group_ids = [m.group_id for m in member_relations]
            
            if not group_ids:
                return jsonify({'groups': []}), 200
            
            groups_list = Group.query.filter(Group.id.in_(group_ids)).all()
            return jsonify({'groups': [g.to_dict() for g in groups_list]}), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'POST':
        try:
            data = request.json
            
            # 验证必填字段
            if not data or not data.get('name'):
                return jsonify({'error': '缺少必要字段：name'}), 400
            
            # 生成唯一的加入密钥
            join_key = generate_join_key()
            while Group.query.filter_by(join_key=join_key).first():
                join_key = generate_join_key()
            
            # 创建新小组
            group = Group(
                name=data['name'],
                description=data.get('description'),
                creator_id=user.id,
                join_key=join_key
            )
            
            db.session.add(group)
            db.session.flush()  # 获取group.id
            
            # 创建者自动成为成员（管理员）
            member = GroupMember(
                group_id=group.id,
                user_id=user.id,
                role='admin'
            )
            db.session.add(member)
            db.session.commit()
            
            return jsonify({
                'message': '小组创建成功',
                'group': group.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'创建小组失败: {str(e)}'}), 500


@bp.route('/<int:group_id>', methods=['GET'])
@login_required
def group_detail(group_id):
    """获取小组详情"""
    user = request.current_user
    
    try:
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': '小组不存在'}), 404
        
        # 检查用户是否是成员
        member = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
        if not member:
            return jsonify({'error': '无权访问该小组'}), 403
        
        return jsonify({'group': group.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:group_id>/members', methods=['GET', 'POST', 'DELETE'])
@login_required
def group_members(group_id):
    """获取小组成员或添加成员"""
    user = request.current_user
    
    # 检查小组是否存在
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': '小组不存在'}), 404
    
    if request.method == 'GET':
        try:
            # 检查用户是否是成员
            member = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
            if not member:
                return jsonify({'error': '无权访问该小组'}), 403
            
            members = GroupMember.query.filter_by(group_id=group_id).all()
            return jsonify({
                'members': [m.to_dict() for m in members]
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'POST':
        try:
            data = request.json
            
            # 检查当前用户是否有管理权限
            current_member = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
            if not current_member or current_member.role != 'admin':
                return jsonify({'error': '只有管理员可以添加成员'}), 403
            
            # 检查是通过密钥加入还是直接添加
            if data.get('join_key'):
                # 通过密钥加入
                if group.join_key != data['join_key']:
                    return jsonify({'error': '密钥错误'}), 400
                
                target_user_id = user.id  # 当前用户加入
            elif data.get('user_id'):
                target_user_id = data['user_id']
            else:
                return jsonify({'error': '缺少必要字段：join_key 或 user_id'}), 400
            
            # 检查是否已是成员
            existing = GroupMember.query.filter_by(
                group_id=group_id,
                user_id=target_user_id
            ).first()
            
            if existing:
                return jsonify({'error': '该用户已是小组成员'}), 400
            
            # 添加成员
            member = GroupMember(
                group_id=group_id,
                user_id=target_user_id,
                role=data.get('role', 'member')
            )
            
            db.session.add(member)
            db.session.commit()
            
            return jsonify({
                'message': '成员添加成功',
                'member': member.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    if request.method == 'DELETE':
        try:
            data = request.json
            target_user_id = data.get('user_id') if data else None
            
            if not target_user_id:
                return jsonify({'error': '缺少必要字段：user_id'}), 400
            
            # 检查当前用户是否有管理权限
            current_member = GroupMember.query.filter_by(group_id=group_id, user_id=user.id).first()
            if not current_member or current_member.role != 'admin':
                return jsonify({'error': '只有管理员可以移除成员'}), 403
            
            # 不能移除自己（除非是最后一个成员）
            if target_user_id == user.id and GroupMember.query.filter_by(group_id=group_id).count() <= 1:
                return jsonify({'error': '不能移除最后一个成员'}), 400
            
            # 查找并删除成员
            member = GroupMember.query.filter_by(
                group_id=group_id,
                user_id=target_user_id
            ).first()
            
            if not member:
                return jsonify({'error': '成员不存在'}), 404
            
            db.session.delete(member)
            db.session.commit()
            
            return jsonify({'message': '成员移除成功'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


@bp.route('/join', methods=['POST'])
@login_required
def join_group_by_key():
    """通过密钥加入小组"""
    user = request.current_user
    
    try:
        data = request.json
        join_key = data.get('join_key') if data else None
        
        if not join_key:
            return jsonify({'error': '缺少必要字段：join_key'}), 400
        
        # 查找小组
        group = Group.query.filter_by(join_key=join_key).first()
        if not group:
            return jsonify({'error': '密钥无效'}), 404
        
        # 检查是否已是成员
        existing = GroupMember.query.filter_by(group_id=group.id, user_id=user.id).first()
        if existing:
            return jsonify({'error': '您已是该小组成员'}), 400
        
        # 添加成员
        member = GroupMember(
            group_id=group.id,
            user_id=user.id,
            role='member'
        )
        
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'message': '加入小组成功',
            'group': group.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

