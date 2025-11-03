"""
用户认证路由
"""
from flask import Blueprint, request, jsonify, current_app
from app.models import db
from app.models.user import User
import jwt
from datetime import datetime, timedelta

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.json
        
        # 验证必填字段
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': '缺少必要字段'}), 400
        
        # 检查用户是否存在
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': '用户名已存在'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': '邮箱已被注册'}), 400
        
        # 创建新用户
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # 生成token
        token = generate_token(user)
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.json
        
        # 验证必填字段
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': '邮箱和密码不能为空'}), 400
        
        # 查找用户
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': '邮箱或密码错误'}), 401
        
        # 生成token
        token = generate_token(user)
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/test', methods=['GET'])
def test():
    """测试端点：检查后端和数据库是否正常"""
    try:
        from app.models.user import User
        user_count = User.query.count()
        return jsonify({
            'status': 'ok',
            'message': '后端服务器正常运行',
            'database': '已连接',
            'user_count': user_count,
            'test_user_exists': User.query.filter_by(email='test@example.com').first() is not None
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@bp.route('/me', methods=['GET'])
def get_current_user():
    """获取当前用户信息"""
    try:
        # 从headers中获取token
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': '未授权'}), 401
        
        # 验证token（简单实现，实际应使用装饰器）
        token = token.replace('Bearer ', '')
        payload = verify_token(token)
        
        if not payload:
            return jsonify({'error': '无效token'}), 401
        
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_token(user):
    """
    生成JWT token
    
    Args:
        user: 用户对象
        
    Returns:
        token字符串
    """
    payload = {
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    
    # 使用current_app获取配置，避免循环导入
    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # PyJWT 2.x版本返回字符串，3.x版本返回字节，统一转换为字符串
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token


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

