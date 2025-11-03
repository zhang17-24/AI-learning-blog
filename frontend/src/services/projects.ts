import api from './api';
import type { Project, ProjectFile, Commit } from '../types';

/**
 * 获取小组的所有项目
 */
export const getProjects = async (groupId: number): Promise<Project[]> => {
  const response = await api.get(`/projects/groups/${groupId}/projects`);
  return response.data.projects;
};

/**
 * 创建项目
 */
export const createProject = async (
  groupId: number,
  projectData: {
    name: string;
    description?: string;
  }
): Promise<Project> => {
  const response = await api.post(`/projects/groups/${groupId}/projects`, projectData);
  return response.data.project;
};

/**
 * 获取项目详情
 */
export const getProject = async (projectId: number): Promise<Project> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.project;
};

/**
 * 更新项目
 */
export const updateProject = async (
  projectId: number,
  projectData: {
    name?: string;
    description?: string;
  }
): Promise<Project> => {
  const response = await api.put(`/projects/${projectId}`, projectData);
  return response.data.project;
};

/**
 * 删除项目
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};

/**
 * 获取项目文件列表
 */
export const getProjectFiles = async (projectId: number): Promise<ProjectFile[]> => {
  const response = await api.get(`/projects/${projectId}/files`);
  return response.data.files;
};

/**
 * 创建/上传项目文件
 */
export const createProjectFile = async (
  projectId: number,
  fileData: {
    filename: string;
    content: string;
    file_type?: string;
  }
): Promise<ProjectFile> => {
  const response = await api.post(`/projects/${projectId}/files`, fileData);
  return response.data.file;
};

/**
 * 获取项目文件
 */
export const getProjectFile = async (projectId: number, fileId: number): Promise<ProjectFile> => {
  const response = await api.get(`/projects/${projectId}/files/${fileId}`);
  return response.data.file;
};

/**
 * 更新项目文件
 */
export const updateProjectFile = async (
  projectId: number,
  fileId: number,
  fileData: {
    content?: string;
    filename?: string;
  }
): Promise<ProjectFile> => {
  const response = await api.put(`/projects/${projectId}/files/${fileId}`, fileData);
  return response.data.file;
};

/**
 * 删除项目文件
 */
export const deleteProjectFile = async (projectId: number, fileId: number): Promise<void> => {
  await api.delete(`/projects/${projectId}/files/${fileId}`);
};

/**
 * 获取项目提交历史
 */
export const getProjectCommits = async (projectId: number): Promise<Commit[]> => {
  const response = await api.get(`/projects/${projectId}/commits`);
  return response.data.commits;
};

/**
 * 创建提交
 */
export const createCommit = async (
  projectId: number,
  commitData: {
    message: string;
    file_changes?: Array<{
      file_id: number;
      change_type: 'add' | 'modify' | 'delete';
      diff_content?: string;
    }>;
  }
): Promise<Commit> => {
  const response = await api.post(`/projects/${projectId}/commits`, commitData);
  return response.data.commit;
};

