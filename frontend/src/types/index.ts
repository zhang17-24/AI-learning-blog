// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

// 课程类型
export interface Course {
  id: number;
  user_id: number;
  course_name: string;
  instructor?: string;
  location?: string;
  day_of_week: number; // 0-6 (周日-周六)
  start_time: string;
  end_time: string;
  created_at: string;
}

// 作业文件类型
export interface AssignmentFile {
  id: number;
  assignment_id: number;
  user_id: number;
  filename: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  file_category?: 'image' | 'document' | 'other';
  created_at: string;
}

// 作业类型
export interface Assignment {
  id: number;
  user_id: number;
  course_id?: number;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  reminder_enabled: boolean;
  reminder_datetime?: string;
  created_at: string;
  updated_at?: string;
  files?: AssignmentFile[];
}

// 学习计划类型
export interface StudyPlan {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  target_hours: number;
  completed_hours: number;
  created_at: string;
}

// 小组类型
export interface Group {
  id: number;
  name: string;
  description?: string;
  creator_id: number;
  join_key?: string;
  created_at: string;
  member_count?: number;
}

// 小组成员类型
export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

// 小组任务类型
export interface GroupTask {
  id: number;
  group_id: number;
  assigner_id: number;
  assignee_id?: number;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

// 项目类型
export interface Project {
  id: number;
  group_id: number;
  name: string;
  description?: string;
  creator_id: number;
  created_at: string;
  updated_at?: string;
  file_count?: number;
  commit_count?: number;
}

// 项目文件类型
export interface ProjectFile {
  id: number;
  project_id: number;
  filename: string;
  content?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  creator_id: number;
  created_at: string;
  updated_at?: string;
}

// 提交类型
export interface Commit {
  id: number;
  project_id: number;
  committer_id: number;
  message: string;
  hash: string;
  created_at: string;
  committer?: User;
  file_changes?: FileChange[];
}

// 文件变更类型
export interface FileChange {
  id: number;
  commit_id: number;
  file_id: number;
  change_type: 'add' | 'modify' | 'delete';
  diff_content?: string;
  file?: ProjectFile;
}

// 消息类型
export interface Message {
  id: number;
  group_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'file' | 'image';
  created_at: string;
  sender?: User;
}

