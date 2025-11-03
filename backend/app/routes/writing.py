"""
写作空间路由
"""
from flask import Blueprint, request, jsonify, current_app
from app.utils.auth import login_required
from app.models import WritingSession, WritingItem, db
from datetime import datetime

bp = Blueprint('writing', __name__)


@bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    """
    获取用户的所有写作会话列表
    
    返回:
        {
            "success": true,
            "sessions": [会话列表]
        }
    """
    try:
        user_id = request.current_user_id
        
        sessions = WritingSession.query.filter_by(user_id=user_id)\
            .order_by(WritingSession.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取写作会话列表失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取会话列表失败: {str(e)}'
        }), 500


@bp.route('/sessions', methods=['POST'])
@login_required
def create_session():
    """
    创建新写作会话
    
    请求体:
        {
            "name": "会话名称（可选）"
        }
    
    返回:
        {
            "success": true,
            "session": 会话信息
        }
    """
    try:
        data = request.json or {}
        user_id = request.current_user_id
        
        # 创建新会话
        session = WritingSession(
            user_id=user_id,
            name=data.get('name', '未命名文档')
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'创建写作会话失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'创建会话失败: {str(e)}'
        }), 500


@bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@login_required
def delete_session(session_id):
    """
    删除会话及其所有项目
    
    参数:
        session_id: 会话ID
    
    返回:
        {
            "success": true
        }
    """
    try:
        user_id = request.current_user_id
        
        session = WritingSession.query.filter_by(id=session_id, user_id=user_id).first()
        if not session:
            return jsonify({
                'success': False,
                'error': '会话不存在'
            }), 404
        
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'删除写作会话失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'删除会话失败: {str(e)}'
        }), 500


@bp.route('/items', methods=['GET'])
@login_required
def get_items():
    """
    获取指定会话的所有项目
    
    参数:
        session_id: 会话ID（可选，不提供则获取所有项目）
    
    返回:
        {
            "success": true,
            "items": [项目列表]
        }
    """
    try:
        user_id = request.current_user_id
        session_id = request.args.get('session_id')
        
        query = WritingItem.query.filter_by(user_id=user_id)
        if session_id:
            query = query.filter_by(session_id=session_id)
        
        items = query.all()
        
        return jsonify({
            'success': True,
            'items': [item.to_dict() for item in items]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'获取写作项目失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'获取项目失败: {str(e)}'
        }), 500


@bp.route('/items', methods=['POST'])
@login_required
def create_item():
    """
    创建或更新写作项目
    
    请求体:
        {
            "session_id": "会话ID（可选）",
            "title": "项目标题",
            "content": "项目内容",
            "item_type": "text 或 image",
            "position_x": 100,
            "position_y": 100,
            "width": 400,
            "height": 300
        }
    
    返回:
        {
            "success": true,
            "item": 项目信息
        }
    """
    try:
        data = request.json
        user_id = request.current_user_id
        
        if not data or not data.get('title'):
            return jsonify({
                'success': False,
                'error': '请提供项目标题'
            }), 400
        
        # 处理会话
        session_id = data.get('session_id')
        if not session_id:
            # 创建新会话
            session = WritingSession(
                user_id=user_id,
                name=data.get('title', '未命名文档')[:50]
            )
            db.session.add(session)
            db.session.flush()
            session_id = session.id
        
        # 创建项目
        item = WritingItem(
            user_id=user_id,
            session_id=session_id,
            title=data.get('title'),
            content=data.get('content', ''),
            item_type=data.get('item_type', 'text'),
            position_x=data.get('position_x', 100),
            position_y=data.get('position_y', 100),
            width=data.get('width', 400),
            height=data.get('height', 300),
        )
        db.session.add(item)
        
        # 更新会话时间
        session = WritingSession.query.get(session_id)
        if session:
            session.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': item.to_dict(),
            'session_id': session_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'创建写作项目失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'创建项目失败: {str(e)}'
        }), 500


@bp.route('/items/<int:item_id>', methods=['PUT'])
@login_required
def update_item(item_id):
    """
    更新写作项目
    
    请求体:
        {
            "title": "项目标题",
            "content": "项目内容",
            "position_x": 100,
            "position_y": 100,
            "width": 400,
            "height": 300
        }
    
    返回:
        {
            "success": true,
            "item": 项目信息
        }
    """
    try:
        data = request.json
        user_id = request.current_user_id
        
        item = WritingItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not item:
            return jsonify({
                'success': False,
                'error': '项目不存在'
            }), 404
        
        # 更新字段
        if 'title' in data:
            item.title = data['title']
        if 'content' in data:
            item.content = data['content']
        if 'position_x' in data:
            item.position_x = data['position_x']
        if 'position_y' in data:
            item.position_y = data['position_y']
        if 'width' in data:
            item.width = data['width']
        if 'height' in data:
            item.height = data['height']
        
        # 更新项目时间
        item.updated_at = datetime.utcnow()
        
        # 更新会话时间
        if item.session:
            item.session.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'更新写作项目失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'更新项目失败: {str(e)}'
        }), 500


@bp.route('/items/<int:item_id>', methods=['DELETE'])
@login_required
def delete_item(item_id):
    """
    删除写作项目
    
    参数:
        item_id: 项目ID
    
    返回:
        {
            "success": true
        }
    """
    try:
        user_id = request.current_user_id
        
        item = WritingItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not item:
            return jsonify({
                'success': False,
                'error': '项目不存在'
            }), 404
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'删除写作项目失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'删除项目失败: {str(e)}'
        }), 500


@bp.route('/sessions', methods=['DELETE'])
@login_required
def clear_all_sessions():
    """
    清空所有写作会话
    
    返回:
        {
            "success": true,
            "message": "清空成功"
        }
    """
    try:
        user_id = request.current_user_id
        
        # 删除用户的所有会话（级联删除项目）
        WritingSession.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '清空成功'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'清空写作会话失败: {str(e)}')
        return jsonify({
            'success': False,
            'error': f'清空失败: {str(e)}'
        }), 500

