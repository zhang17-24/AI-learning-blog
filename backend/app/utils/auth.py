"""
认证工具函数
"""
from functools import wraps
from flask import request, jsonify, current_app
from app.models.user import User
import jwt


def get_current_user():
    """
    从请求头中获取当前用户
    
    Returns:
        User对象或None
    """
    try:
        token = request.headers.get('Authorization')
        if not token:
            return None
        
        # 移除Bearer前缀
        token = token.replace('Bearer ', '')
        
        # 验证token
        payload = verify_token(token)
        if not payload:
            return None
        
        # 获取用户
        user = User.query.get(payload['user_id'])
        return user
        
    except Exception:
        return None


def verify_token(token):
    """
    验证JWT token
    
    Args:
        token: token字符串
        
    Returns:
        payload或None
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def login_required(f):
    """
    登录验证装饰器
    
    使用示例:
        @bp.route('/api/courses')
        @login_required
        def get_courses():
            user = request.current_user
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': '未授权，请先登录'}), 401
        
        # 将用户对象和用户ID添加到request中，方便在路由函数中使用
        request.current_user = user
        request.current_user_id = user.id
        return f(*args, **kwargs)
    
    return decorated_function

