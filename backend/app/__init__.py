"""
Flask应用初始化模块
"""
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
from .config import DevelopmentConfig

# 初始化扩展
migrate = Migrate()
socketio = SocketIO(cors_allowed_origins="*")


def create_app(config_class=DevelopmentConfig):
    """
    应用工厂函数
    
    Args:
        config_class: 配置类
        
    Returns:
        配置好的Flask应用实例
    """
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    CORS(app)
    
    # 初始化数据库
    from .models import db
    db.init_app(app)
    
    # 初始化数据库迁移（需要在db.init_app之后）
    migrate.init_app(app, db)
    socketio.init_app(app, async_mode='eventlet')
    
    # 注册蓝图
    from .routes import auth, courses, assignments, groups, ai, ws, projects, tasks, writing, dashboard
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(courses.bp, url_prefix='/api/courses')
    app.register_blueprint(assignments.bp, url_prefix='/api/assignments')
    app.register_blueprint(groups.bp, url_prefix='/api/groups')
    app.register_blueprint(ai.bp, url_prefix='/api/ai')
    app.register_blueprint(ws.bp, url_prefix='/api/ws')
    app.register_blueprint(projects.bp, url_prefix='/api/projects')
    app.register_blueprint(tasks.bp, url_prefix='/api')
    app.register_blueprint(writing.bp, url_prefix='/api/writing')
    app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')
    
    # 注册SocketIO事件
    ws.register_socketio_events(socketio)
    
    with app.app_context():
        db.create_all()
        # 确保上传目录存在
        import os
        upload_folder = app.config.get('UPLOAD_FOLDER')
        if upload_folder and not os.path.exists(upload_folder):
            os.makedirs(upload_folder, exist_ok=True)
    
    return app


__all__ = ['create_app', 'socketio']
