/**
 * 写作空间服务API
 */
import api from './api';

export interface WritingSession {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WritingItem {
  id: number;
  user_id: number;
  session_id: number | null;
  title: string;
  content: string;
  item_type: 'text' | 'image';
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

/**
 * 获取会话列表
 */
export const getWritingSessions = async (): Promise<{ success: boolean; sessions?: WritingSession[]; error?: string }> => {
  try {
    const response = await api.get('/writing/sessions');
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
export const createWritingSession = async (name?: string): Promise<{ success: boolean; session?: WritingSession; error?: string }> => {
  try {
    const response = await api.post('/writing/sessions', { name });
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
export const deleteWritingSession = async (sessionId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await api.delete(`/writing/sessions/${sessionId}`);
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
 * 清空所有会话
 */
export const clearAllWritingSessions = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await api.delete('/writing/sessions');
    return response.data;
  } catch (error: any) {
    console.error('清空会话失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '清空失败',
    };
  }
};

/**
 * 获取项目列表
 */
export const getWritingItems = async (sessionId?: number): Promise<{ success: boolean; items?: WritingItem[]; error?: string }> => {
  try {
    const url = sessionId ? `/writing/items?session_id=${sessionId}` : '/writing/items';
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    console.error('获取项目失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取失败',
    };
  }
};

/**
 * 创建或更新项目
 */
export const saveWritingItem = async (item: {
  session_id?: number;
  title: string;
  content?: string;
  item_type?: 'text' | 'image';
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}): Promise<{ success: boolean; item?: WritingItem; session_id?: number; error?: string }> => {
  try {
    const response = await api.post('/writing/items', item);
    return response.data;
  } catch (error: any) {
    console.error('保存项目失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '保存失败',
    };
  }
};

/**
 * 更新项目
 */
export const updateWritingItem = async (itemId: number, updates: {
  title?: string;
  content?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}): Promise<{ success: boolean; item?: WritingItem; error?: string }> => {
  try {
    const response = await api.put(`/writing/items/${itemId}`, updates);
    return response.data;
  } catch (error: any) {
    console.error('更新项目失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '更新失败',
    };
  }
};

/**
 * 删除项目
 */
export const deleteWritingItem = async (itemId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await api.delete(`/writing/items/${itemId}`);
    return response.data;
  } catch (error: any) {
    console.error('删除项目失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '删除失败',
    };
  }
};

