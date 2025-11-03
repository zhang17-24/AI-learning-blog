"""
Flask应用启动文件
"""
from app import create_app, socketio

# 创建应用实例
app = create_app()

if __name__ == '__main__':
    # 启动开发服务器
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True
    )

