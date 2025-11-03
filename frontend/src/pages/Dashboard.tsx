import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useState, useEffect } from 'react';
import Courses from './Courses';
import Assignments from './Assignments';
import Groups from './Groups';
import AIHelper from './AIHelper';
import AIChatWindow from '../components/AIChatWindow';
import DraggableAIChatButton from '../components/DraggableAIChatButton';
import GlobalPomodoro from '../components/GlobalPomodoro';
import TextSearchToolbar from '../components/TextSearchToolbar';
import AIChatApp from '../components/AIChatApp';
import ClappingHand from '../components/ClappingHand';
import { CardSkeleton, ListSkeleton } from '../components/Skeleton';
import { getDashboardStats, getNotifications, markNotificationRead, generateNotifications, getOverview } from '../services/dashboard';
import type { Notification as NotificationType, OverviewResponse } from '../services/dashboard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('ai');
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  
  // 实时统计数据
  const [stats, setStats] = useState([
    {
      name: '今日学习时长',
      value: '0',
      unit: '小时',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => setActiveTab('assignments'), // 点击跳转到作业页面
    },
    {
      name: '待完成作业',
      value: '0',
      unit: '项',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => setActiveTab('assignments'), // 点击跳转到作业页面
    },
    {
      name: '本周课程',
      value: '0',
      unit: '节',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => setActiveTab('courses'), // 点击跳转到课程页面
    },
    {
      name: '学习进度',
      value: '0',
      unit: '%',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      onClick: () => setActiveTab('overview'), // 点击跳转到概览页面
    },
  ]);

  // 消息提醒状态
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  // 获取学习概览数据（包括最近完成、每日激励、歌曲推荐、AI建议）
  useEffect(() => {
    const fetchOverview = async () => {
      // 如果已经在概览页面，才加载数据
      if (activeTab === 'overview') {
        setLoadingOverview(true);
        try {
          const result = await getOverview();
          setOverview(result);
        } catch (error) {
          console.error('获取学习概览失败:', error);
        } finally {
          setLoadingOverview(false);
        }
      }
    };

    fetchOverview();
  }, [activeTab]); // 当切换到概览页面时重新加载

  // 加载实时统计数据（使用新的API，AI分析作业量推断学习时长）
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getDashboardStats();
        if (result.success && result.stats) {
          setStats(prev => [
            { ...prev[0], value: result.stats.study_duration.toFixed(1) }, // 今日学习时长（AI推断）
            { ...prev[1], value: result.stats.pending_assignments.toString() }, // 待完成作业
            { ...prev[2], value: result.stats.this_week_courses.toString() }, // 本周课程
            { ...prev[3], value: result.stats.learning_progress.toString() }, // 学习进度
          ]);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    };
    
    loadStats();
  }, []);

  // 加载消息提醒
  useEffect(() => {
    const loadNotifications = async () => {
      setLoadingNotifications(true);
      try {
        // 首先生成消息提醒
        await generateNotifications();
        
        // 然后获取消息列表
        const result = await getNotifications({ limit: 10 });
        if (result.success && result.notifications) {
          setNotifications(result.notifications);
          setUnreadCount(result.unread_count || 0);
        }
      } catch (error) {
        console.error('加载消息提醒失败:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };
    
    loadNotifications();
    // 每30秒刷新一次消息提醒
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // 标记消息为已读
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const result = await markNotificationRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  };

  // 处理标签切换
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // 添加平滑滚动效果
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 处理消息点击
  const handleNotificationClick = (notification: NotificationType) => {
    // 标记为已读
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // 跳转到对应页面
    if (notification.link) {
      if (notification.link.startsWith('/assignments')) {
        setActiveTab('assignments');
      } else if (notification.link.startsWith('/groups')) {
        setActiveTab('groups');
      } else if (notification.link.startsWith('/courses')) {
        setActiveTab('courses');
      }
    }
  };

  // 文本选择监听 - 延迟弹出，避免误触
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    const handleTextSelection = (e: MouseEvent) => {
      // 清除之前的定时器
      if (timer) {
        clearTimeout(timer);
      }
      
      timer = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        // 降低最小长度要求，模仿豆包
        if (text && text.length >= 2 && selection && selection.toString().trim().length > 0) {
          // 检查是否在输入框中
          const activeElement = document.activeElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
          }
          
          // 获取选中文本的位置
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // 显示搜索工具栏
          setSelectedText(text);
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
        } else {
          // 没有选中文本，隐藏工具栏
          setSelectedText(null);
        }
      }, 300); // 延迟300ms弹出
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('click', (e) => {
      // 点击其他地方隐藏工具栏
      if (e.target && !(e.target as HTMLElement).closest('.text-search-toolbar')) {
        setSelectedText(null);
      }
    });

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const navigation = [
    { id: 'ai', name: 'AI助手', icon: '🤖' },
    { id: 'overview', name: '概览', icon: '📊' },
    { id: 'courses', name: '课程', icon: '📚' },
    { id: 'assignments', name: '作业', icon: '📝' },
    { id: 'groups', name: '小组', icon: '👥' },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI智能学习助手
                </h1>
                <p className="text-xs text-gray-500">个性化学习管理系统</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.username || '用户'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 欢迎区域 - 更紧凑 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            欢迎回来，{user?.username || '用户'}！
            <ClappingHand size={32} className="ml-1" />
          </h2>
          <p className="text-sm text-gray-600">今天也要加油学习哦～</p>
        </div>

        {/* 统计卡片 - 可点击，优化布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in">
          {stats.map((stat, index) => (
            <button
              key={index}
              onClick={stat.onClick}
              className={`${stat.bgColor} rounded-xl p-4 shadow-md hover:shadow-lg transition-smooth transform hover:-translate-y-1 active:scale-95 border border-white/50 cursor-pointer text-left w-full card-hover button-press`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  {stat.icon}
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {stat.value}
                  <span className="text-base text-gray-600 ml-1">{stat.unit}</span>
                </span>
              </div>
              <p className="text-xs font-medium text-gray-600">{stat.name}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 左侧导航 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-3 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3 px-2">功能菜单</h3>
              <nav className="space-y-1.5">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-smooth text-sm button-press ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm scale-105'
                        : 'text-gray-700 hover:bg-gray-50 hover:scale-105'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3 space-y-4">
            {/* 消息提醒模块 */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">消息提醒</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                    {unreadCount} 条未读
                  </span>
                )}
              </div>
              
              {loadingNotifications ? (
                <div className="py-4">
                  <ListSkeleton count={3} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  暂无消息提醒
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        notification.is_read
                          ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {notification.type === 'assignment' && '📝'}
                              {notification.type === 'study_time' && '⏰'}
                              {notification.type === 'group' && '👥'}
                            </span>
                            <h4 className={`text-sm font-medium ${
                              notification.is_read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                          {notification.content && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 功能展示区域 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 min-h-[350px] content-area animate-fade-in">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">学习概览</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                      <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">📈</span>
                        本周学习趋势
                      </h4>
                      <div className="h-24 flex items-end space-x-1.5">
                        {[60, 75, 55, 80, 90, 70, 85].map((height, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md transition-all hover:opacity-80"
                              style={{ height: `${height}%` }}
                            ></div>
                            <span className="text-xs text-gray-500 mt-1">{['一', '二', '三', '四', '五', '六', '日'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">✅</span>
                        最近完成
                      </h4>
                      {loadingOverview ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      ) : overview?.recent_completed && overview.recent_completed.length > 0 ? (
                        <div className="space-y-2">
                          {overview.recent_completed.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2 text-xs">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-gray-700 flex-1">{item.title}</span>
                              <span className="text-xs text-gray-500">{item.completed_time}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-xs">
                          暂无已完成作业
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 每日激励和歌曲推荐 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">✨</span>
                        每日激励
                      </h4>
                      {loadingOverview ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-gray-600">加载中...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {overview?.daily_inspiration?.motivation || '今天也要加油学习哦！💪'}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">🎵</span>
                        今日歌曲推荐
                      </h4>
                      {loadingOverview ? (
                        <div className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-gray-600">加载中...</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {overview?.daily_inspiration?.song?.name || '轻音乐推荐'}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            {overview?.daily_inspiration?.song?.artist || 'Various Artists'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {overview?.daily_inspiration?.song?.reason || '适合学习的背景音乐'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI学习建议 - 最重要的部分 */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">💬</span>
                      AI学习建议
                    </h4>
                    {loadingOverview ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">AI正在分析你的学习任务...</span>
                      </div>
                    ) : overview?.ai_suggestions ? (
                      <div className="space-y-3">
                        {/* 总预估时长 */}
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">总预估完成时长</span>
                            <span className="text-lg font-bold text-blue-600">{overview.ai_suggestions.total_hours} 小时</span>
                          </div>
                          {overview.ai_suggestions.assignments_analysis.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">作业分析：</p>
                              <div className="space-y-1">
                                {overview.ai_suggestions.assignments_analysis.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 truncate flex-1">{item.title}</span>
                                    <span className="text-gray-500 ml-2">{item.estimated_hours}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {overview.ai_suggestions.group_tasks_analysis.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">小组任务分析：</p>
                              <div className="space-y-1">
                                {overview.ai_suggestions.group_tasks_analysis.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 truncate flex-1">{item.title}</span>
                                    <span className="text-gray-500 ml-2">{item.estimated_hours}h</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 行动指南 */}
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs font-medium text-gray-700 mb-2">行动建议和指南：</p>
                          <ul className="space-y-1.5">
                            {overview.ai_suggestions.action_guide.map((guide, idx) => (
                              <li key={idx} className="flex items-start text-sm text-gray-700">
                                <span className="text-blue-500 mr-2">•</span>
                                <span className="flex-1">{guide}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        暂无学习建议，请先添加一些作业或小组任务
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'courses' && <Courses />}
              
              {activeTab === 'assignments' && <Assignments />}
              
              {activeTab === 'groups' && <Groups />}
              
              {activeTab === 'ai' && <AIHelper />}
              
              {activeTab !== 'overview' && activeTab !== 'courses' && activeTab !== 'assignments' && activeTab !== 'groups' && activeTab !== 'ai' && (
                <div className="flex flex-col items-center justify-center h-56 text-center">
                  <div className="text-5xl mb-3">
                    {navigation.find(n => n.id === activeTab)?.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {navigation.find(n => n.id === activeTab)?.name}功能
                  </h3>
                  <p className="text-sm text-gray-500">
                    此功能正在开发中，敬请期待...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI伙伴聊天窗口 - 可拖动和调整大小 */}
      {showAIChat && (
        <AIChatWindow onClose={() => setShowAIChat(false)} />
      )}

      {/* AI伙伴触发按钮 - 可拖动 */}
      {!showAIChat && (
        <DraggableAIChatButton onClick={() => setShowAIChat(true)} />
      )}

      {/* 全局番茄钟 - 左下角 */}
      <GlobalPomodoro />

      {/* 文本搜索浮动工具栏 */}
      {selectedText && (
        <div className="text-search-toolbar">
          <TextSearchToolbar
            selectedText={selectedText}
            position={selectionPosition}
            onClose={() => setSelectedText(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;

