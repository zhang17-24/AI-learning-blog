/**
 * AI伙伴聊天应用 - 参考豆包/DeepSeek设计
 * 使用会话管理API实现真正的新建对话功能
 */
import { useState, useEffect } from 'react';
import AIChat from './AIChat';
import { getChatSessions, createChatSession, deleteChatSession, clearChatHistory as clearHistoryAPI } from '../services/ai';
import type { ChatSession } from '../services/ai';

const AIChatApp = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载所有会话
  const loadSessions = async () => {
    setLoading(true);
    try {
      const result = await getChatSessions();
      if (result.success && result.sessions) {
        setSessions(result.sessions);
        // 默认选择最新的会话
        if (result.sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(result.sessions[0].id);
        }
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 新建对话
  const handleNewChat = async () => {
    try {
      const result = await createChatSession('新对话');
      if (result.success && result.session) {
        setSessions([result.session, ...sessions]);
        setCurrentSessionId(result.session.id);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm('确定要删除这条对话吗？')) {
      try {
        const result = await deleteChatSession(sessionId);
        if (result.success) {
          setSessions(sessions.filter(s => s.id !== sessionId));
          // 如果删除的是当前会话，切换到第一个
          if (currentSessionId === sessionId) {
            setCurrentSessionId(sessions.length > 1 ? sessions.find(s => s.id !== sessionId)?.id || null : null);
          }
        }
      } catch (error) {
        console.error('删除会话失败:', error);
      }
    }
  };

  // 清空所有历史
  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有聊天记录吗？此操作不可恢复。')) {
      try {
        await clearHistoryAPI();
        setSessions([]);
        setCurrentSessionId(null);
      } catch (error) {
        console.error('清空失败:', error);
      }
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧历史记录栏 */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI伙伴</h3>
              <p className="text-xs text-gray-500">智能学习助手</p>
            </div>
          </div>
          
          {/* 新建对话按钮 */}
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新建对话</span>
          </button>

          {/* 快捷功能 */}
          <div className="mt-3 space-y-1">
            <div className="px-3 py-2 text-sm font-medium text-gray-900">快捷功能</div>
            <button className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2">
              <span>✍️</span>
              <span>帮我写作</span>
            </button>
            <button className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2">
              <span>🎨</span>
              <span>AI创作</span>
            </button>
            <button className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2">
              <span>💻</span>
              <span>代码助手</span>
            </button>
          </div>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              暂无聊天记录<br />开始新对话吧
            </div>
          ) : (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">历史对话</div>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative px-3 py-2 rounded-lg transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => setCurrentSessionId(session.id)}
                    className="w-full text-left"
                  >
                    <div className="font-medium text-sm truncate">{session.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(session.updated_at).toLocaleString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </button>
                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-3 border-t border-gray-200">
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              清空所有记录
            </button>
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div className="flex-1 flex flex-col">
        <AIChat sessionId={currentSessionId} onSessionUpdate={loadSessions} />
      </div>
    </div>
  );
};

export default AIChatApp;
