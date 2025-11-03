import { useState, useEffect } from 'react';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  uploadAssignmentFile,
  deleteAssignmentFile,
  downloadAssignmentFile,
} from '../services/assignments';
import { getCourses } from '../services/courses';
import type { Assignment, AssignmentFile } from '../types';
import type { Course } from '../types';

// 优先级选项
const PRIORITIES = [
  { value: 'low', label: '低', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: '高', color: 'bg-red-100 text-red-700' },
];

// 状态选项
const STATUSES = [
  { value: 'pending', label: '待完成', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700' },
];

const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 过滤和排序状态
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [sortBy, setSortBy] = useState<'due_date' | 'created_at' | 'priority'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    course_id: '' as number | '',
    reminder_enabled: false,
    reminder_datetime: '',
  });

  // 文件上传状态
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});

  // 加载作业列表
  const loadAssignments = async () => {
    try {
      setLoading(true);
      const params: any = {
        sort_by: sortBy,
        order: sortOrder,
      };
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      
      const data = await getAssignments(params);
      setAssignments(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载作业失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载课程列表
  const loadCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error('加载课程失败:', err);
    }
  };

  useEffect(() => {
    loadAssignments();
    loadCourses();
  }, [filterStatus, filterPriority, sortBy, sortOrder]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      course_id: '',
      reminder_enabled: false,
      reminder_datetime: '',
    });
    setEditingAssignment(null);
    setShowForm(false);
  };

  // 打开编辑表单
  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      due_date: assignment.due_date.substring(0, 16), // 转换为本地datetime格式
      priority: assignment.priority,
      status: assignment.status,
      course_id: assignment.course_id || '',
      reminder_enabled: assignment.reminder_enabled,
      reminder_datetime: assignment.reminder_datetime 
        ? assignment.reminder_datetime.substring(0, 16) 
        : '',
    });
    setShowForm(true);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const assignmentData: any = {
        title: formData.title,
        description: formData.description,
        due_date: new Date(formData.due_date).toISOString(),
        priority: formData.priority,
        status: formData.status,
        reminder_enabled: formData.reminder_enabled,
      };

      if (formData.course_id) {
        assignmentData.course_id = formData.course_id;
      }
      if (formData.reminder_enabled && formData.reminder_datetime) {
        assignmentData.reminder_datetime = new Date(formData.reminder_datetime).toISOString();
      }

      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, assignmentData);
        setSuccess('作业更新成功！');
      } else {
        await createAssignment(assignmentData);
        setSuccess('作业创建成功！');
      }

      resetForm();
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  // 删除作业
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个作业吗？删除后无法恢复。')) {
      return;
    }

    try {
      await deleteAssignment(id);
      setSuccess('作业删除成功！');
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  // 上传文件
  const handleFileUpload = async (assignmentId: number, file: File) => {
    setUploadingFiles(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await uploadAssignmentFile(assignmentId, file);
      setSuccess('文件上传成功！');
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.error || '文件上传失败');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  // 删除文件
  const handleFileDelete = async (assignmentId: number, fileId: number) => {
    if (!window.confirm('确定要删除这个文件吗？')) {
      return;
    }

    try {
      await deleteAssignmentFile(assignmentId, fileId);
      setSuccess('文件删除成功！');
      loadAssignments();
    } catch (err: any) {
      setError(err.response?.data?.error || '文件删除失败');
    }
  };

  // 下载文件
  const handleFileDownload = async (assignmentId: number, fileId: number, filename: string) => {
    try {
      const blob = await downloadAssignmentFile(assignmentId, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.error || '文件下载失败');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 获取文件图标
  const getFileIcon = (file: AssignmentFile) => {
    if (file.file_category === 'image') {
      return '🖼️';
    } else if (file.file_category === 'document') {
      return '📄';
    }
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* 标题和操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">作业管理</h3>
          <p className="text-sm text-gray-600 mt-1">管理你的所有作业任务</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>添加作业</span>
        </button>
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 过滤和排序 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级筛选</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="due_date">截止日期</option>
              <option value="created_at">创建时间</option>
              <option value="priority">优先级</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">排序顺序</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          </div>
        </div>
      </div>

      {/* 作业列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-600">还没有作业，点击"添加作业"开始创建吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* 左侧：作业信息 */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">{assignment.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            PRIORITIES.find((p) => p.value === assignment.priority)?.color ||
                            PRIORITIES[1].color
                          }`}
                        >
                          {PRIORITIES.find((p) => p.value === assignment.priority)?.label || '中'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            STATUSES.find((s) => s.value === assignment.status)?.color ||
                            STATUSES[0].color
                          }`}
                        >
                          {STATUSES.find((s) => s.value === assignment.status)?.label || '待完成'}
                        </span>
                        {assignment.reminder_enabled && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            ⏰ 已设置提醒
                          </span>
                        )}
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>📅 截止：{formatDate(assignment.due_date)}</span>
                        {assignment.reminder_datetime && (
                          <span>⏰ 提醒：{formatDate(assignment.reminder_datetime)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 文件列表 */}
                  {assignment.files && assignment.files.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {assignment.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-lg">{getFileIcon(file)}</span>
                            <span className="text-sm text-gray-700">{file.filename}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
                            <button
                              onClick={() => handleFileDownload(assignment.id, file.id, file.filename)}
                              className="text-indigo-600 hover:text-indigo-700 text-xs"
                              title="下载"
                            >
                              ⬇️
                            </button>
                            <button
                              onClick={() => handleFileDelete(assignment.id, file.id)}
                              className="text-red-600 hover:text-red-700 text-xs"
                              title="删除"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 文件上传 */}
                  <div className="mt-2">
                    <label className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors text-sm text-gray-700">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(assignment.id, file);
                          }
                        }}
                        disabled={uploadingFiles[assignment.id]}
                      />
                      <span className="mr-2">📎</span>
                      {uploadingFiles[assignment.id] ? '上传中...' : '上传文件'}
                    </label>
                  </div>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => handleEdit(assignment)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑表单模态框 */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-bounce-in border border-gray-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingAssignment ? '编辑作业' : '添加作业'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作业标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例如：数学作业 - 第3章"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作业描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="详细描述作业内容和要求..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      截止日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">关联课程</label>
                    <select
                      value={formData.course_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          course_id: e.target.value ? Number(e.target.value) : '',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">无</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 提醒设置 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="reminder_enabled"
                      checked={formData.reminder_enabled}
                      onChange={(e) =>
                        setFormData({ ...formData, reminder_enabled: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="reminder_enabled" className="ml-2 text-sm font-medium text-gray-700">
                      设置提醒
                    </label>
                  </div>
                  {formData.reminder_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        提醒时间
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.reminder_datetime}
                        onChange={(e) =>
                          setFormData({ ...formData, reminder_datetime: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all"
                  >
                    {editingAssignment ? '更新' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;

