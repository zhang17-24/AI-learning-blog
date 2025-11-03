import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { login, register } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 表单数据
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) setError('');
  };

  // 表单提交
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 登录
        const { user } = await login(formData.email, formData.password);
        console.log('登录成功:', user);
        showSuccess('登录成功！');
        // 更新全局用户状态
        setAuthUser(user);
        // 延迟跳转，让Toast显示
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        // 注册
        if (!formData.username.trim()) {
          setError('用户名不能为空');
          setLoading(false);
          return;
        }
        const { user } = await register(formData.username, formData.email, formData.password);
        console.log('注册成功:', user);
        showSuccess('注册成功！');
        // 更新全局用户状态
        setAuthUser(user);
        // 延迟跳转，让Toast显示
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (err: any) {
      console.error('认证失败:', err);
      
      // 处理不同类型的错误
      let errorMessage = '操作失败，请重试';
      
      if (err.response) {
        // 服务器返回了响应，但有错误状态码
        errorMessage = err.response.data?.error || `服务器错误: ${err.response.status}`;
      } else if (err.request) {
        // 请求已发出，但没有收到响应
        errorMessage = '无法连接到服务器，请检查后端服务是否启动（端口5000）';
      } else {
        // 其他错误
        errorMessage = err.message || '操作失败，请重试';
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 顶部导航栏 - CNKI风格 */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-lg font-semibold">AI智能学习助手</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <button className="hover:text-blue-200 transition-colors">帮助</button>
              <button className="hover:text-blue-200 transition-colors">联系我们</button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 - 蓝色背景 */}
      <div className="flex-1 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Logo区域 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-xl">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2">
              AI智能学习助手
            </h1>
            <p className="text-blue-700 text-lg">个性化学习管理系统</p>
          </div>

          {/* 登录表单卡片 */}
          <div className="bg-white rounded-xl shadow-2xl border border-blue-200 max-w-md mx-auto overflow-hidden animate-bounce-in">
            {/* 标签切换 */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setFormData({ username: '', email: '', password: '' });
                }}
                className={`flex-1 py-4 text-center font-semibold transition-all ${
                  isLogin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                个人登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setFormData({ username: '', email: '', password: '' });
                }}
                className={`flex-1 py-4 text-center font-semibold transition-all ${
                  !isLogin
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                注册账户
              </button>
            </div>

            <div className="p-8">
              {/* 错误提示 */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded animate-shake" role="alert">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm">{error}</span>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* 注册时显示用户名输入 */}
                {!isLogin && (
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      用户名
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required={!isLogin}
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                      placeholder="请输入用户名"
                    />
                  </div>
                )}

                {/* 邮箱输入 */}
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                    placeholder="请输入邮箱地址"
                  />
                </div>

                {/* 密码输入 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                    placeholder="请输入密码（至少6位）"
                    minLength={6}
                  />
                </div>

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 button-press"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      {isLogin ? '立即登录' : '立即注册'}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 服务图标区域 - CNKI风格 */}
        <div className="bg-blue-50 border-t border-blue-200 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-center text-gray-700 font-semibold mb-6">常用服务</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 justify-items-center">
              {[
                { name: '智能学习', icon: '🧠' },
                { name: '作业管理', icon: '📝' },
                { name: '课程表', icon: '📅' },
                { name: '学习统计', icon: '📊' },
                { name: 'AI助手', icon: '🤖' },
                { name: '小组协作', icon: '👥' },
                { name: '知识库', icon: '📚' },
                { name: '个人中心', icon: '👤' },
              ].map((service, index) => (
                <div key={index} className="flex flex-col items-center cursor-pointer group">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all transform group-hover:-translate-y-1 mb-2">
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                  <span className="text-xs text-gray-600 text-center">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

