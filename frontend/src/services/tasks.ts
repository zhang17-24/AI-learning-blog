import api from './api';
import type { GroupTask } from '../types';

/**
 * 获取项目任务列表
 */
export const getProjectTasks = async (projectId: number): Promise<GroupTask[]> => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data.tasks;
};

/**
 * 创建任务
 */
export const createTask = async (
  projectId: number,
  taskData: {
    title: string;
    description?: string;
    due_date: string;
    assignee_id?: number;
    status?: 'pending' | 'in_progress' | 'completed';
  }
): Promise<GroupTask> => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return response.data.task;
};

/**
 * 更新任务
 */
export const updateTask = async (
  projectId: number,
  taskId: number,
  taskData: {
    title?: string;
    description?: string;
    due_date?: string;
    assignee_id?: number;
    status?: 'pending' | 'in_progress' | 'completed';
  }
): Promise<GroupTask> => {
  const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
  return response.data.task;
};

/**
 * 删除任务
 */
export const deleteTask = async (projectId: number, taskId: number): Promise<void> => {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
};

