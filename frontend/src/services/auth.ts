import api from './api';
import type { User } from '../types';

/**
 * 用户注册
 */
export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
  });
  
  const { token, user } = response.data;
  
  // 保存token到localStorage
  localStorage.setItem('token', token);
  
  return { token, user };
};

/**
 * 用户登录
 */
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  
  const { token, user } = response.data;
  
  // 保存token到localStorage
  localStorage.setItem('token', token);
  
  return { token, user };
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

/**
 * 用户登出
 */
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

