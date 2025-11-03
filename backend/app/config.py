"""
应用配置文件
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """基础配置类"""
    # 应用配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/learning_assistant'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('FLASK_ENV') == 'development'
    
    # JWT配置
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_EXPIRES', 1800))  # 30分钟
    
    # LLM提供商配置
    # 可选值: xunfei, openai
    # 默认使用讯飞星火API
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'xunfei')
    
    # 讯飞星火API配置
    XUNFEI_APPID = os.getenv('XUNFEI_APPID', '65ef9963')
    XUNFEI_API_KEY = os.getenv('XUNFEI_API_KEY', 'ae6fcee7c40724e9cb504ae571852ea2')
    XUNFEI_API_SECRET = os.getenv('XUNFEI_API_SECRET', 'N2FkZDQwNGJkNDJmYmQwYjcyZjhhYzJh')
    XUNFEI_API_URL = os.getenv('XUNFEI_API_URL', 'wss://spark-api.xf-yun.com/v1.1/chat')
    XUNFEI_DOMAIN = os.getenv('XUNFEI_DOMAIN', 'lite')  # Spark Lite模型
    
    # OpenAI兼容API配置（支持OpenAI、DeepSeek、Groq等）
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')  # 或 https://api.deepseek.com/v1
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')  # 或 deepseek-chat, gpt-4 等
    
    # SocketIO配置
    SOCKETIO_CORS_ORIGINS = os.getenv('SOCKETIO_CORS_ORIGINS', '*')
    
    # 文件上传配置
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../uploads')


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    TESTING = False
    # 开发环境默认使用SQLite，无需安装PostgreSQL
    # SQLite数据库文件会创建在backend目录下
    _db_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),  # backend目录
        'learning_assistant.db'
    )
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f'sqlite:///{_db_path}'  # 使用SQLite数据库，绝对路径
    )


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """测试环境配置"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

