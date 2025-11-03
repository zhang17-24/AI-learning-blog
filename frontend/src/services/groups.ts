import api from './api';
import type { Group, GroupMember } from '../types';

/**
 * 获取所有小组
 */
export const getGroups = async (): Promise<Group[]> => {
  const response = await api.get('/groups');
  return response.data.groups;
};

/**
 * 创建小组
 */
export const createGroup = async (groupData: {
  name: string;
  description?: string;
}): Promise<Group> => {
  const response = await api.post('/groups', groupData);
  return response.data.group;
};

/**
 * 获取单个小组详情
 */
export const getGroup = async (id: number): Promise<Group> => {
  const response = await api.get(`/groups/${id}`);
  return response.data.group;
};

/**
 * 通过密钥加入小组
 */
export const joinGroupByKey = async (joinKey: string): Promise<Group> => {
  const response = await api.post('/groups/join', { join_key: joinKey });
  return response.data.group;
};

/**
 * 获取小组成员列表
 */
export const getGroupMembers = async (groupId: number): Promise<GroupMember[]> => {
  const response = await api.get(`/groups/${groupId}/members`);
  return response.data.members;
};

/**
 * 添加小组成员
 */
export const addGroupMember = async (
  groupId: number,
  userData: {
    user_id?: number;
    join_key?: string;
    role?: 'admin' | 'member';
  }
): Promise<GroupMember> => {
  const response = await api.post(`/groups/${groupId}/members`, userData);
  return response.data.member;
};

/**
 * 移除小组成员
 */
export const removeGroupMember = async (groupId: number, userId: number): Promise<void> => {
  await api.delete(`/groups/${groupId}/members`, { data: { user_id: userId } });
};

