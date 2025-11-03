import { useState, useEffect } from 'react';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  importCoursesFromFile,
  importCoursesFromData,
} from '../services/courses';
import type { Course } from '../types';

// 星期映射：0=周日, 1=周一, ..., 6=周六
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 默认时间段定义
const DEFAULT_TIME_SLOTS = [
  { id: 1, label: '第一大节', start: '08:00', end: '09:40' },
  { id: 2, label: '第二大节', start: '10:00', end: '11:40' },
  { id: 3, label: '第三大节', start: '14:00', end: '15:40' },
  { id: 4, label: '第四大节', start: '16:00', end: '17:40' },
  { id: 5, label: '第五大节', start: '19:00', end: '20:40' },
];

// 时间段类型定义
interface TimeSlot {
  id: number;
  label: string;
  start: string;
  end: string;
}

// 从localStorage加载时间段配置
const loadTimeSlots = (): TimeSlot[] => {
  try {
    const saved = localStorage.getItem('course_time_slots');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 验证数据格式
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('加载时间段配置失败:', e);
  }
  return DEFAULT_TIME_SLOTS;
};

// 保存时间段配置到localStorage
const saveTimeSlots = (slots: TimeSlot[]) => {
  try {
    localStorage.setItem('course_time_slots', JSON.stringify(slots));
  } catch (e) {
    console.error('保存时间段配置失败:', e);
  }
};

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showTimeSlotSettings, setShowTimeSlotSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 时间段状态（从localStorage加载）
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(loadTimeSlots());
  
  // 时间段编辑状态
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlotFormData, setTimeSlotFormData] = useState({
    label: '',
    start: '',
    end: '',
  });

  // 表单数据
  const [formData, setFormData] = useState({
    course_name: '',
    instructor: '',
    location: '',
    day_of_week: 1, // 默认为周一
    start_time: '08:00',
    end_time: '09:40',
  });

  // 加载课程列表
  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // 清空表单
  const resetForm = () => {
    setFormData({
      course_name: '',
      instructor: '',
      location: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:40',
    });
    setEditingCourse(null);
    setShowForm(false);
  };

  // 打开添加表单
  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  // 打开编辑表单
  const handleEditClick = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name,
      instructor: course.instructor || '',
      location: course.location || '',
      day_of_week: course.day_of_week,
      start_time: course.start_time,
      end_time: course.end_time,
    });
    setShowForm(true);
  };

  // 提交表单（创建或更新）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
        setSuccess('课程更新成功！');
      } else {
        await createCourse(formData);
        setSuccess('课程创建成功！');
      }

      resetForm();
      loadCourses();
    } catch (err: any) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  // 删除课程
  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这门课程吗？')) {
      return;
    }

    try {
      setError(null);
      await deleteCourse(id);
      setSuccess('课程删除成功！');
      loadCourses();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败');
    }
  };

  // 处理文件导入
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const result = await importCoursesFromFile(file);
      setSuccess(`${result.message}${result.errors ? `（${result.errors.length}条错误）` : ''}`);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('导入错误:', result.errors);
      }

      loadCourses();
      setShowImport(false);
    } catch (err: any) {
      setError(err.response?.data?.error || '导入失败');
    } finally {
      setLoading(false);
      // 清空input值，允许重新选择同一文件
      e.target.value = '';
    }
  };

  // 获取指定时间和星期几的课程
  const getCourseAt = (dayOfWeek: number, timeSlot: TimeSlot) => {
    return courses.filter(
      (course) =>
        course.day_of_week === dayOfWeek &&
        course.start_time <= timeSlot.end &&
        course.end_time >= timeSlot.start
    );
  };

  // 时间段管理功能
  const handleAddTimeSlot = () => {
    setEditingTimeSlot(null);
    setTimeSlotFormData({
      label: '',
      start: '08:00',
      end: '09:40',
    });
  };

  const handleEditTimeSlot = (slot: TimeSlot) => {
    setEditingTimeSlot(slot);
    setTimeSlotFormData({
      label: slot.label,
      start: slot.start,
      end: slot.end,
    });
  };

  const handleSaveTimeSlot = () => {
    // 验证数据
    if (!timeSlotFormData.label.trim()) {
      setError('时间段名称不能为空');
      return;
    }
    if (!timeSlotFormData.start || !timeSlotFormData.end) {
      setError('开始时间和结束时间不能为空');
      return;
    }
    if (timeSlotFormData.start >= timeSlotFormData.end) {
      setError('开始时间必须早于结束时间');
      return;
    }

    // 检查时间重叠
    const newStart = timeSlotFormData.start;
    const newEnd = timeSlotFormData.end;
    const hasOverlap = timeSlots.some((slot) => {
      if (editingTimeSlot && slot.id === editingTimeSlot.id) {
        return false; // 跳过正在编辑的项
      }
      return (
        (newStart >= slot.start && newStart < slot.end) ||
        (newEnd > slot.start && newEnd <= slot.end) ||
        (newStart <= slot.start && newEnd >= slot.end)
      );
    });

    if (hasOverlap) {
      setError('时间段不能重叠');
      return;
    }

    try {
      setError(null);
      let updatedSlots: TimeSlot[];

      if (editingTimeSlot) {
        // 更新现有时间段
        updatedSlots = timeSlots.map((slot) =>
          slot.id === editingTimeSlot.id
            ? { ...editingTimeSlot, ...timeSlotFormData }
            : slot
        );
      } else {
        // 添加新时间段
        const newId = Math.max(...timeSlots.map((s) => s.id), 0) + 1;
        updatedSlots = [...timeSlots, { id: newId, ...timeSlotFormData }];
      }

      // 按开始时间排序
      updatedSlots.sort((a, b) => a.start.localeCompare(b.start));

      setTimeSlots(updatedSlots);
      saveTimeSlots(updatedSlots);
      setSuccess(editingTimeSlot ? '时间段更新成功！' : '时间段添加成功！');
      setEditingTimeSlot(null);
      setTimeSlotFormData({ label: '', start: '08:00', end: '09:40' });
    } catch (err: any) {
      setError('保存时间段失败');
    }
  };

  const handleDeleteTimeSlot = (id: number) => {
    if (timeSlots.length <= 1) {
      setError('至少需要保留一个时间段');
      return;
    }
    if (!window.confirm('确定要删除这个时间段吗？')) {
      return;
    }

    const updatedSlots = timeSlots.filter((slot) => slot.id !== id);
    setTimeSlots(updatedSlots);
    saveTimeSlots(updatedSlots);
    setSuccess('时间段删除成功！');
  };

  const handleResetTimeSlots = () => {
    if (!window.confirm('确定要恢复默认时间段设置吗？')) {
      return;
    }
    setTimeSlots(DEFAULT_TIME_SLOTS);
    saveTimeSlots(DEFAULT_TIME_SLOTS);
    setSuccess('已恢复默认时间段设置！');
  };


  // 清除提示消息
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">课程管理</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTimeSlotSettings(!showTimeSlotSettings)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            title="时间段设置"
          >
            ⚙️ 时间段设置
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            📥 导入课程
          </button>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            ➕ 添加课程
          </button>
        </div>
      </div>

      {/* 提示消息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* 时间段设置 */}
      {showTimeSlotSettings && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">时间段设置</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetTimeSlots}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                恢复默认
              </button>
              <button
                onClick={() => {
                  setShowTimeSlotSettings(false);
                  setEditingTimeSlot(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 时间段列表 */}
          <div className="space-y-3 mb-4">
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{slot.label}</div>
                  <div className="text-sm text-gray-600">
                    {slot.start} - {slot.end}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTimeSlot(slot)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteTimeSlot(slot.id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                    disabled={timeSlots.length <= 1}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 添加/编辑时间段表单 */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              {editingTimeSlot ? '编辑时间段' : '添加新时间段'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  时间段名称 *
                </label>
                <input
                  type="text"
                  value={timeSlotFormData.label}
                  onChange={(e) =>
                    setTimeSlotFormData({ ...timeSlotFormData, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：第一大节"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间 *
                </label>
                <input
                  type="time"
                  value={timeSlotFormData.start}
                  onChange={(e) =>
                    setTimeSlotFormData({ ...timeSlotFormData, start: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间 *
                </label>
                <input
                  type="time"
                  value={timeSlotFormData.end}
                  onChange={(e) =>
                    setTimeSlotFormData({ ...timeSlotFormData, end: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveTimeSlot}
                  className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm"
                >
                  {editingTimeSlot ? '更新' : '添加'}
                </button>
              </div>
            </div>
            {editingTimeSlot && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setEditingTimeSlot(null);
                    setTimeSlotFormData({ label: '', start: '08:00', end: '09:40' });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  取消编辑
                </button>
              </div>
            )}
            <div className="mt-4">
              <button
                onClick={handleAddTimeSlot}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                ➕ 添加新时间段
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入区域 */}
      {showImport && (
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">导入课程</h3>
            <button
              onClick={() => setShowImport(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择CSV文件
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileImport}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
              <p className="font-semibold mb-1">CSV格式要求：</p>
              <p>course_name,instructor,location,day_of_week,start_time,end_time</p>
              <p className="mt-1">示例：线性代数,熊波,教学楼A101,1,08:00,09:40</p>
              <p className="mt-1">day_of_week: 0=周日, 1=周一, ..., 6=周六</p>
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingCourse ? '编辑课程' : '添加课程'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：线性代数"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授课教师
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：熊波"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上课地点
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：教学楼A101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  星期 *
                </label>
                <select
                  required
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {WEEKDAYS.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间 *
                </label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间 *
                </label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm"
              >
                {editingCourse ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 课程表 */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    周/节次
                  </th>
                  {WEEKDAYS.slice(1, 8).map((day, index) => (
                    <th
                      key={index + 1}
                      className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, slotIndex) => (
                  <tr key={slotIndex}>
                    <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                      <div>{timeSlot.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {timeSlot.start} - {timeSlot.end}
                      </div>
                    </td>
                    {WEEKDAYS.slice(1, 8).map((day, dayIndex) => {
                      const dayCourses = getCourseAt(dayIndex + 1, timeSlot);
                      return (
                        <td
                          key={dayIndex + 1}
                          className="border border-gray-200 px-2 py-2 align-top"
                          style={{ minWidth: '120px' }}
                        >
                          {dayCourses.map((course) => (
                            <div
                              key={course.id}
                              className="mb-2 p-2 rounded-lg bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors group relative"
                            >
                              <div className="text-xs font-semibold text-gray-900 mb-1">
                                {course.course_name}
                              </div>
                              {course.instructor && (
                                <div className="text-xs text-gray-600 mb-1">
                                  教师: {course.instructor}
                                </div>
                              )}
                              {course.location && (
                                <div className="text-xs text-gray-500 mb-1">
                                  {course.location}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {course.start_time} - {course.end_time}
                              </div>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <button
                                  onClick={() => handleEditClick(course)}
                                  className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                                  title="编辑"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(course.id)}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                                  title="删除"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                          {dayCourses.length === 0 && (
                            <div className="text-xs text-gray-400 text-center py-4">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 课程列表视图（备用，用于查看所有课程） */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">所有课程列表</h3>
          <div className="space-y-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{course.course_name}</div>
                  <div className="text-sm text-gray-600">
                    {WEEKDAYS[course.day_of_week]} {course.start_time} - {course.end_time}
                    {course.instructor && ` | 教师: ${course.instructor}`}
                    {course.location && ` | 地点: ${course.location}`}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(course)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;

