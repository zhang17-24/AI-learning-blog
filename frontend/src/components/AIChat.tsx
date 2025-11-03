/**
 * AI学习伙伴聊天组件
 */
import { useState, useEffect, useRef } from 'react';
import { chatWithAI, getChatHistory, clearChatHistory as clearHistory } from '../services/ai';
import type { ChatHistoryMessage } from '../services/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  id?: number;
}

interface AIChatProps {
  sessionId?: number | null;
  onSessionUpdate?: () => void;
}

const AIChat = ({ sessionId, onSessionUpdate }: AIChatProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载聊天历史（从数据库）
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getChatHistory(sessionId || undefined);
        if (result.success && result.messages) {
          // 转换数据库消息格式为本地消息格式
          const convertedMessages: Message[] = result.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString(),
            id: msg.id,
          }));
          setMessages(convertedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error);
      }
    };
    
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId || null);
      setMessages([]); // 切换会话时清空消息
    }
    
    loadHistory();
  }, [sessionId]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 消息现在自动保存到数据库，无需本地保存

  // 消息变化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 构建对话历史
      const conversationHistory = messages
        .concat(userMessage)
        .slice(-12) // 只保留最近6轮对话
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const result = await chatWithAI(userMessage.content, conversationHistory, sessionId || undefined);

      if (result.success && result.reply) {
        // 如果返回了新的session_id，更新currentSessionId并触发会话列表刷新
        if (result.session_id && result.session_id !== currentSessionId) {
          setCurrentSessionId(result.session_id);
          onSessionUpdate?.();
        }
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.reply,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // 显示错误消息
        const errorMessage: Message = {
          role: 'assistant',
          content: `抱歉，我遇到了问题：${result.error || '网络错误'}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉，发生了错误：${err.message || '未知错误'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 清除聊天历史
  const handleClearHistory = async () => {
    if (window.confirm('确定要清除所有聊天记录吗？')) {
      try {
        const result = await clearHistory();
        if (result.success) {
          setMessages([]);
        } else {
          alert(`清除失败：${result.error}`);
        }
      } catch (error) {
        console.error('清除聊天历史失败:', error);
        alert('清除失败，请稍后重试');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 聊天头部 - 简化版 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold">AI伙伴</h3>
              <p className="text-gray-500 text-xs">强大的搜索能力与情感陪伴</p>
            </div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">开始和AI伙伴聊天吧！</p>
            <p className="text-xs mt-2">强大的搜索能力和温暖的情感陪伴</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-indigo-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '发送'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

