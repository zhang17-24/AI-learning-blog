import api from './api';
import type { Course } from '../types';

/**
 * 获取所有课程
 */
export const getCourses = async (): Promise<Course[]> => {
  const response = await api.get('/courses');
  return response.data.courses;
};

/**
 * 获取单个课程
 */
export const getCourse = async (id: number): Promise<Course> => {
  const response = await api.get(`/courses/${id}`);
  return response.data.course;
};

/**
 * 创建课程
 */
export const createCourse = async (courseData: {
  course_name: string;
  instructor?: string;
  location?: string;
  day_of_week: number; // 0-6 (周日-周六)
  start_time: string; // HH:MM格式
  end_time: string; // HH:MM格式
}): Promise<Course> => {
  const response = await api.post('/courses', courseData);
  return response.data.course;
};

/**
 * 更新课程
 */
export const updateCourse = async (
  id: number,
  courseData: Partial<{
    course_name: string;
    instructor: string;
    location: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>
): Promise<Course> => {
  const response = await api.put(`/courses/${id}`, courseData);
  return response.data.course;
};

/**
 * 删除课程
 */
export const deleteCourse = async (id: number): Promise<void> => {
  await api.delete(`/courses/${id}`);
};

/**
 * 导入课程（通过文件）
 */
export const importCoursesFromFile = async (file: File): Promise<{
  message: string;
  imported_count: number;
  errors?: string[];
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/courses/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * 导入课程（通过JSON数据）
 */
export const importCoursesFromData = async (courses: Array<{
  course_name: string;
  instructor?: string;
  location?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}>): Promise<{
  message: string;
  imported_count: number;
  errors?: string[];
}> => {
  const response = await api.post('/courses/import', { courses });
  return response.data;
};

