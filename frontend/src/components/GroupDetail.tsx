import { useState, useEffect } from 'react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectFiles,
  createProjectFile,
  getProjectFile,
  updateProjectFile,
  deleteProjectFile,
  getProjectCommits,
  createCommit,
} from '../services/projects';
import { useAuth } from '../contexts/AuthContext';
import type { Group, Project, ProjectFile, Commit } from '../types';

interface GroupDetailProps {
  group: Group;
  onClose: () => void;
}

const GroupDetail = ({ group, onClose }: GroupDetailProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'chat' | 'tasks'>('projects');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 项目表单
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
  });
  
  // 文件表单
  const [showFileForm, setShowFileForm] = useState(false);
  const [editingFile, setEditingFile] = useState<ProjectFile | null>(null);
  const [fileFormData, setFileFormData] = useState({
    filename: '',
    content: '',
  });
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  
  // 提交表单
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [commitFormData, setCommitFormData] = useState({
    message: '',
  });

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects(group.id);
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [group.id]);

  // 加载文件列表
  const loadFiles = async (projectId: number) => {
    try {
      const data = await getProjectFiles(projectId);
      setProjectFiles(data);
    } catch (err: any) {
      console.error('加载文件失败:', err);
    }
  };

  // 加载提交历史
  const loadCommits = async (projectId: number) => {
    try {
      const data = await getProjectCommits(projectId);
      setCommits(data);
    } catch (err: any) {
      console.error('加载提交历史失败:', err);
    }
  };

  // 选择项目
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    loadFiles(project.id);
    loadCommits(project.id);
  };

  // 创建项目
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProject = await createProject(group.id, projectFormData);
      setProjects([...projects, newProject]);
      setShowProjectForm(false);
      setProjectFormData({ name: '', description: '' });
      setSuccess('项目创建成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建项目失败');
    }
  };

  // 更新项目
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      const updated = await updateProject(editingProject.id, projectFormData);
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setShowProjectForm(false);
      setEditingProject(null);
      setProjectFormData({ name: '', description: '' });
      setSuccess('项目更新成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '更新项目失败');
    }
  };

  // 删除项目
  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('确定要删除该项目吗？')) return;
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setProjectFiles([]);
        setCommits([]);
      }
      setSuccess('项目删除成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '删除项目失败');
    }
  };

  // 打开项目编辑表单
  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description || '',
    });
    setShowProjectForm(true);
  };

  // 创建文件
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      let fileData: any;
      
      // 如果是文件上传
      if (fileUpload) {
        // 读取文件内容（支持文本和二进制文件）
        const reader = new FileReader();
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          
          // 先尝试按文本读取，如果是文本文件
          if (fileUpload.type.startsWith('text/') || fileUpload.type === 'application/json') {
            reader.readAsText(fileUpload);
          } else {
            // 二进制文件转base64
            reader.readAsDataURL(fileUpload);
          }
        });
        
        fileData = {
          filename: fileFormData.filename || fileUpload.name,
          content: content,
          file_type: fileUpload.type || 'text/plain',
        };
      } else {
        // 文本文件
        fileData = {
          filename: fileFormData.filename,
          content: fileFormData.content,
          file_type: 'text/plain',
        };
      }
      
      const newFile = await createProjectFile(selectedProject.id, fileData);
      setProjectFiles([...projectFiles, newFile]);
      setShowFileForm(false);
      setFileFormData({ filename: '', content: '' });
      setFileUpload(null);
      setSuccess('文件创建成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建文件失败');
    }
  };

  // 更新文件
  const handleUpdateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editingFile) return;
    try {
      const updated = await updateProjectFile(
        selectedProject.id,
        editingFile.id,
        fileFormData
      );
      setProjectFiles(projectFiles.map(f => f.id === updated.id ? updated : f));
      setShowFileForm(false);
      setEditingFile(null);
      setFileFormData({ filename: '', content: '' });
      setSuccess('文件更新成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '更新文件失败');
    }
  };

  // 删除文件
  const handleDeleteFile = async (fileId: number) => {
    if (!selectedProject) return;
    if (!window.confirm('确定要删除该文件吗？')) return;
    try {
      await deleteProjectFile(selectedProject.id, fileId);
      setProjectFiles(projectFiles.filter(f => f.id !== fileId));
      setSuccess('文件删除成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '删除文件失败');
    }
  };

  // 打开文件编辑表单
  const openEditFile = (file: ProjectFile) => {
    setEditingFile(file);
    setFileFormData({
      filename: file.filename,
      content: file.content || '',
    });
    setShowFileForm(true);
  };

  // 下载文件
  const handleDownloadFile = async (fileContent: string, filename: string, fileType: string = 'text/plain') => {
    try {
      let blob: Blob;
      
      if (fileContent.startsWith('data:')) {
        // Data URL（Base64编码的文件）
        const response = await fetch(fileContent);
        blob = await response.blob();
      } else {
        // 普通文本文件
        blob = new Blob([fileContent], { type: fileType });
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('文件下载成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('文件下载失败: ' + (err.message || '未知错误'));
    }
  };

  // 创建提交
  const handleCreateCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      // 获取所有修改的文件
      const fileChanges = projectFiles.map(file => ({
        file_id: file.id,
        change_type: 'modify' as const,
        diff_content: `更新了文件 ${file.filename}`,
      }));
      
      const newCommit = await createCommit(selectedProject.id, {
        message: commitFormData.message,
        file_changes: fileChanges,
      });
      
      // 刷新提交历史
      await loadCommits(selectedProject.id);
      
      setShowCommitForm(false);
      setCommitFormData({ message: '' });
      setSuccess('提交成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失败');
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-bounce-in border border-gray-100">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
            <p className="text-sm text-gray-600">{group.description || '无描述'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 消息提示 */}
        {(error || success) && (
          <div className="px-6 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
                <button onClick={clearMessages} className="ml-2 float-right">✕</button>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
                {success}
                <button onClick={clearMessages} className="ml-2 float-right">✕</button>
              </div>
            )}
          </div>
        )}

        {/* 标签页 */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📁 项目
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ✅ 任务
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 聊天
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'projects' && (
            <div className="grid grid-cols-12 gap-4">
              {/* 左侧项目列表 */}
              <div className="col-span-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">项目列表</h3>
                  <button
                    onClick={() => {
                      setEditingProject(null);
                      setProjectFormData({ name: '', description: '' });
                      setShowProjectForm(true);
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    ➕ 新建
                  </button>
                </div>
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedProject?.id === project.id
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectProject(project)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          {project.description && (
                            <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span>📄 {project.file_count || 0} 文件</span>
                            <span>📝 {project.commit_count || 0} 提交</span>
                          </div>
                        </div>
                        {project.creator_id === user?.id && (
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditProject(project);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              编辑
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      暂无项目
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧文件列表 */}
              <div className="col-span-8">
                {selectedProject ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">{selectedProject.name} - 文件</h3>
                      <button
                        onClick={() => {
                          setEditingFile(null);
                          setFileFormData({ filename: '', content: '' });
                          setShowFileForm(true);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                      >
                        ➕ 新建文件
                      </button>
                    </div>

                    {/* 文件列表 */}
                    <div className="space-y-2 mb-6">
                      {projectFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              📄
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.filename}</p>
                              <p className="text-xs text-gray-500">
                                {(file.file_size || 0) > 0 ? `${(file.file_size! / 1024).toFixed(2)} KB` : '空文件'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditFile(file)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                      {projectFiles.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          暂无文件
                        </div>
                      )}
                    </div>

                    {/* 提交历史 */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">提交历史</h3>
                        <button
                          onClick={() => setShowCommitForm(true)}
                          disabled={projectFiles.length === 0}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          ✅ 提交文件
                        </button>
                      </div>
                      <div className="space-y-2">
                        {commits.map((commit, index) => (
                          <div
                            key={commit.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {commit.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {commit.committer?.username || '未知用户'} · 版本 v{commits.length - index} · {commit.hash.substring(0, 8)}
                                </p>
                                {commit.file_changes && commit.file_changes.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600 mb-1">变更文件：</p>
                                    <div className="flex flex-wrap gap-1">
                                      {commit.file_changes.map((fc) => (
                                        <div
                                          key={fc.id}
                                          className="flex items-center gap-1"
                                        >
                                          <span
                                            className={`px-2 py-0.5 rounded text-xs ${
                                              fc.change_type === 'add'
                                                ? 'bg-green-100 text-green-700'
                                                : fc.change_type === 'delete'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}
                                          >
                                            {fc.file?.filename || `文件 ${fc.file_id}`}
                                          </span>
                                          {fc.file && fc.change_type !== 'delete' && (
                                            <button
                                              onClick={() => {
                                                if (fc.file?.content) {
                                                  handleDownloadFile(
                                                    fc.file.content,
                                                    fc.file.filename,
                                                    fc.file.file_type
                                                  );
                                                }
                                              }}
                                              className="text-green-600 hover:text-green-800 text-xs"
                                              title="下载"
                                            >
                                              📥
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(commit.created_at).toLocaleString('zh-CN', { 
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                        {commits.length === 0 && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            暂无提交记录
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-3">📁</div>
                    <p>选择一个项目查看详情</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🚧</div>
              <p>任务管理功能开发中...</p>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🚧</div>
              <p>聊天功能开发中...</p>
            </div>
          )}
        </div>

        {/* 项目表单弹窗 */}
        {showProjectForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-bounce-in border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingProject ? '编辑项目' : '创建项目'}
              </h3>
              <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目名称 *
                  </label>
                  <input
                    type="text"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目描述
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingProject ? '更新' : '创建'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectForm(false);
                      setEditingProject(null);
                      setProjectFormData({ name: '', description: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 文件表单弹窗 */}
        {showFileForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingFile ? '编辑文件' : '创建文件'}
              </h3>
              <form onSubmit={editingFile ? handleUpdateFile : handleCreateFile}>
                  {!editingFile && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        上传文件（可选）
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文件名 *
                    </label>
                    <input
                      type="text"
                      value={fileFormData.filename}
                      onChange={(e) => setFileFormData({ ...fileFormData, filename: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {!fileUpload && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        文件内容
                      </label>
                      <textarea
                        value={fileFormData.content}
                        onChange={(e) => setFileFormData({ ...fileFormData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        rows={15}
                      />
                    </div>
                  )}
                  {fileUpload && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">已选择文件: {fileUpload.name}</p>
                      <p className="text-xs text-blue-600 mt-1">文件大小: {(fileUpload.size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {editingFile ? '更新' : '创建'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFileForm(false);
                        setEditingFile(null);
                        setFileFormData({ filename: '', content: '' });
                        setFileUpload(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </form>
            </div>
          </div>
        )}

        {/* 提交表单弹窗 */}
        {showCommitForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-bounce-in border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">提交文件</h3>
              <form onSubmit={handleCreateCommit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提交信息 *
                  </label>
                  <textarea
                    value={commitFormData.message}
                    onChange={(e) => setCommitFormData({ ...commitFormData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="请输入提交信息..."
                    required
                  />
                </div>
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    将提交 {projectFiles.length} 个文件
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    提交
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommitForm(false);
                      setCommitFormData({ message: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;

