/**
 * AI服务API调用
 */
import api from './api';

// 导出类型定义
export interface FileAnalysisResult {
  success: boolean;
  summary?: string;
  estimated_hours?: number;
  suggestions?: string[];
  error?: string;
}

export interface DailyInspiration {
  success: boolean;
  motivation: string;
  song: {
    name: string;
    artist: string;
    reason: string;
  };
  error?: string;
}

// 导出其他类型
export interface LearningStep {
  order: number;
  title: string;
  description: string;
  estimated_time: string;
  prerequisites: string[];
}

export interface GoalBreakdownResult {
  success: boolean;
  steps?: LearningStep[];
  learning_path?: string;
  error?: string;
}

export interface ChatResult {
  success: boolean;
  reply?: string;
  session_id?: number;
  error?: string;
}

export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryMessage {
  id: number;
  session_id?: number;
  user_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatHistoryResult {
  success: boolean;
  messages?: ChatHistoryMessage[];
  error?: string;
}

// 同时导出类型别名（兼容性）
export type { FileAnalysisResult as FileAnalysisResultType, DailyInspiration as DailyInspirationType };

/**
 * 分析文件内容
 */
export const analyzeFile = async (
  content: string,
  fileType: string = 'text',
  filename?: string
): Promise<FileAnalysisResult> => {
  try {
    const response = await api.post<FileAnalysisResult>('/ai/analyze-file', {
      content,
      file_type: fileType,
      filename,
    });
    return response.data;
  } catch (error: any) {
    console.error('文件分析失败:', error);
    // 记录详细的错误信息
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求发送失败，未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    // 返回详细的错误信息
    const errorMessage = error.response?.data?.error || 
                         error.response?.data?.detail || 
                         error.message || 
                         '分析失败，请稍后重试';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * 获取每日激励语句和歌曲推荐
 */
export const getDailyInspiration = async (): Promise<DailyInspiration> => {
  try {
    const response = await api.get<DailyInspiration>('/ai/daily-inspiration');
    return response.data;
  } catch (error: any) {
    console.error('获取每日激励失败:', error);
    return {
      success: false,
      motivation: '今天也要加油学习哦！💪',
      song: {
        name: '轻音乐推荐',
        artist: 'Various Artists',
        reason: '适合学习的背景音乐',
      },
      error: error.response?.data?.error || '获取失败',
    };
  }
};

/**
 * 从文件提取文本内容（支持Word文档）
 */
export const extractFileText = async (file: File): Promise<{ success: boolean; content?: string; filename?: string; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ success: boolean; content?: string; filename?: string; error?: string }>(
      '/ai/extract-text',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('文件文本提取失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '文件解析失败，请稍后重试',
    };
  }
};

/**
 * 学习目标拆解
 */
export const breakDownGoal = async (
  goalDescription: string,
  knowledgeBackground: string = ''
): Promise<GoalBreakdownResult> => {
  try {
    const response = await api.post<GoalBreakdownResult>('/ai/break-down-goal', {
      goal_description: goalDescription,
      knowledge_background: knowledgeBackground,
    });
    return response.data;
  } catch (error: any) {
    console.error('学习目标拆解失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '拆解失败，请稍后重试',
    };
  }
};

/**
 * AI聊天
 */
export const chatWithAI = async (
  message: string,
  conversationHistory: any[] = [],
  sessionId?: number
): Promise<ChatResult> => {
  try {
    const response = await api.post<ChatResult>('/ai/chat', {
      message,
      conversation_history: conversationHistory,
      session_id: sessionId,
    });
    return response.data;
  } catch (error: any) {
    console.error('AI聊天失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '聊天失败，请稍后重试',
    };
  }
};

/**
 * 获取会话列表
 */
export const getChatSessions = async (): Promise<{ success: boolean; sessions?: ChatSession[]; error?: string }> => {
  try {
    const response = await api.get('/ai/chat-sessions');
    return response.data;
  } catch (error: any) {
    console.error('获取会话列表失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取失败',
    };
  }
};

/**
 * 创建新会话
 */
export const createChatSession = async (title?: string): Promise<{ success: boolean; session?: ChatSession; error?: string }> => {
  try {
    const response = await api.post('/ai/chat-sessions', { title });
    return response.data;
  } catch (error: any) {
    console.error('创建会话失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '创建失败',
    };
  }
};

/**
 * 删除会话
 */
export const deleteChatSession = async (sessionId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await api.delete(`/ai/chat-sessions/${sessionId}`);
    return response.data;
  } catch (error: any) {
    console.error('删除会话失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '删除失败',
    };
  }
};

/**
 * 获取聊天历史
 */
export const getChatHistory = async (sessionId?: number): Promise<ChatHistoryResult> => {
  try {
    const url = sessionId ? `/ai/chat-history?session_id=${sessionId}` : '/ai/chat-history';
    const response = await api.get<ChatHistoryResult>(url);
    return response.data;
  } catch (error: any) {
    console.error('获取聊天历史失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取失败',
    };
  }
};

/**
 * 删除单条聊天消息
 */
export const deleteChatMessage = async (messageId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await api.delete(`/ai/chat-history/${messageId}`);
    return response.data;
  } catch (error: any) {
    console.error('删除消息失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '删除失败',
    };
  }
};

/**
 * 清空所有聊天历史
 */
export const clearChatHistory = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await api.delete('/ai/chat-history');
    return response.data;
  } catch (error: any) {
    console.error('清空聊天历史失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '清空失败',
    };
  }
};

