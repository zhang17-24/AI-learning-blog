"""
数据库初始化脚本
用于创建数据库表和初始数据
"""
import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    from app.models import db, User
    from app.config import DevelopmentConfig
except ImportError as e:
    print(f"❌ 导入模块失败: {e}")
    print("\n请确保：")
    print("1. 已激活虚拟环境")
    print("2. 已安装所有依赖 (运行 setup_env_simple.bat)")
    sys.exit(1)


def init_database():
    """初始化数据库"""
    try:
        # 创建应用实例
        app = create_app(DevelopmentConfig)
        
        with app.app_context():
            # 删除所有表（谨慎使用，仅用于开发环境）
            print("正在创建数据库表...")
            try:
                db.drop_all()
            except Exception as e:
                print(f"⚠️  删除旧表时出错（可能是首次运行）: {e}")
            
            # 创建所有表
            db.create_all()
            
            print("✅ 数据库表创建成功！")
            
            # 可选：创建测试用户（仅开发环境）
            try:
                # 检查是否已有测试用户
                test_user = User.query.filter_by(email='test@example.com').first()
                if not test_user:
                    test_user = User(
                        username='testuser',
                        email='test@example.com'
                    )
                    test_user.set_password('123456')  # 测试密码
                    db.session.add(test_user)
                    db.session.commit()
                    print("✅ 测试用户创建成功！")
                    print("   邮箱: test@example.com")
                    print("   密码: 123456")
                else:
                    print("ℹ️  测试用户已存在")
            except Exception as e:
                print(f"⚠️  创建测试用户时出错: {e}")
            
            print("\n✅ 数据库初始化完成！")
            return True
            
    except Exception as e:
        print(f"\n❌ 数据库初始化失败: {e}")
        import traceback
        print("\n详细错误信息：")
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)

