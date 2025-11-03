import api from './api';
import type { Assignment, AssignmentFile } from '../types';

/**
 * 获取所有作业
 */
export const getAssignments = async (params?: {
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  course_id?: number;
  sort_by?: 'due_date' | 'created_at' | 'priority';
  order?: 'asc' | 'desc';
}): Promise<Assignment[]> => {
  const response = await api.get('/assignments', { params });
  return response.data.assignments;
};

/**
 * 获取单个作业
 */
export const getAssignment = async (id: number): Promise<Assignment> => {
  const response = await api.get(`/assignments/${id}`);
  return response.data.assignment;
};

/**
 * 创建作业
 */
export const createAssignment = async (assignmentData: {
  title: string;
  description?: string;
  due_date: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  course_id?: number;
  reminder_enabled?: boolean;
  reminder_datetime?: string;
}): Promise<Assignment> => {
  const response = await api.post('/assignments', assignmentData);
  return response.data.assignment;
};

/**
 * 更新作业
 */
export const updateAssignment = async (
  id: number,
  assignmentData: Partial<{
    title: string;
    description: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    course_id: number;
    reminder_enabled: boolean;
    reminder_datetime: string;
  }>
): Promise<Assignment> => {
  const response = await api.put(`/assignments/${id}`, assignmentData);
  return response.data.assignment;
};

/**
 * 删除作业
 */
export const deleteAssignment = async (id: number): Promise<void> => {
  await api.delete(`/assignments/${id}`);
};

/**
 * 上传作业文件
 */
export const uploadAssignmentFile = async (
  assignmentId: number,
  file: File
): Promise<AssignmentFile> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/assignments/${assignmentId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.file;
};

/**
 * 获取作业的所有文件
 */
export const getAssignmentFiles = async (assignmentId: number): Promise<AssignmentFile[]> => {
  const response = await api.get(`/assignments/${assignmentId}/files`);
  return response.data.files;
};

/**
 * 删除作业文件
 */
export const deleteAssignmentFile = async (
  assignmentId: number,
  fileId: number
): Promise<void> => {
  await api.delete(`/assignments/${assignmentId}/files/${fileId}`);
};

/**
 * 下载作业文件
 */
export const downloadAssignmentFile = async (
  assignmentId: number,
  fileId: number
): Promise<Blob> => {
  const response = await api.get(`/assignments/${assignmentId}/files/${fileId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

