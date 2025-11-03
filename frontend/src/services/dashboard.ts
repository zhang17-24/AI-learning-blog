/**
 * Dashboard服务API调用
 */
import api from './api';

// 统计数据接口
export interface DashboardStats {
  study_duration: number;
  pending_assignments: number;
  this_week_courses: number;
  learning_progress: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  stats?: DashboardStats;
  error?: string;
}

// 最近完成作业接口
export interface RecentCompleted {
  id: number;
  title: string;
  completed_time: string;
  updated_at?: string;
}

// 学习概览接口
export interface OverviewResponse {
  success: boolean;
  recent_completed?: RecentCompleted[];
  daily_inspiration?: {
    motivation: string;
    song: {
      name: string;
      artist: string;
      reason: string;
    };
  };
  ai_suggestions?: {
    total_hours: number;
    assignments_analysis: Array<{
      title: string;
      estimated_hours: number;
      due_date: string;
      priority: string;
    }>;
    group_tasks_analysis: Array<{
      title: string;
      estimated_hours: number;
      due_date: string;
    }>;
    action_guide: string[];
  };
  error?: string;
}

// 消息提醒接口
export interface Notification {
  id: number;
  user_id: number;
  type: 'assignment' | 'study_time' | 'group';
  title: string;
  content?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications?: Notification[];
  unread_count?: number;
  error?: string;
}

/**
 * 获取首页统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  try {
    const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  } catch (error: any) {
    console.error('获取统计数据失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取统计数据失败',
    };
  }
};

/**
 * 获取消息提醒列表
 */
export const getNotifications = async (params?: {
  unread_only?: boolean;
  limit?: number;
}): Promise<NotificationsResponse> => {
  try {
    const response = await api.get<NotificationsResponse>('/dashboard/notifications', { params });
    return response.data;
  } catch (error: any) {
    console.error('获取消息提醒失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取消息提醒失败',
    };
  }
};

/**
 * 标记消息为已读
 */
export const markNotificationRead = async (notificationId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await api.put(`/dashboard/notifications/${notificationId}/read`);
    return response.data;
  } catch (error: any) {
    console.error('标记消息已读失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '标记消息已读失败',
    };
  }
};

/**
 * 生成消息提醒（手动触发）
 */
export const generateNotifications = async (): Promise<{ success: boolean; created_count?: number; error?: string }> => {
  try {
    const response = await api.post('/dashboard/notifications/generate');
    return response.data;
  } catch (error: any) {
    console.error('生成消息提醒失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '生成消息提醒失败',
    };
  }
};

/**
 * 获取学习概览数据
 */
export const getOverview = async (): Promise<OverviewResponse> => {
  try {
    const response = await api.get<OverviewResponse>('/dashboard/overview');
    return response.data;
  } catch (error: any) {
    console.error('获取学习概览失败:', error);
    return {
      success: false,
      error: error.response?.data?.error || '获取学习概览失败',
    };
  }
};
