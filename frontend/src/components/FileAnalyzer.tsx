/**
 * 文件内容分析组件
 */
import { useState, useEffect } from 'react';
import { analyzeFile, extractFileText } from '../services/ai';
import type { FileAnalysisResult } from '../services/ai';
import { getGroups } from '../services/groups';
import { getProjects } from '../services/projects';
import { getProjectCommits, getProjectFile } from '../services/projects';
import type { Group, Project, Commit, FileChange } from '../types';

const FileAnalyzer = () => {
  const [content, setContent] = useState('');
  const [fileType, setFileType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FileAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 从提交历史选择文件
  const [showCommitSelector, setShowCommitSelector] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('请输入文件内容');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeFile(content, fileType);
      setResult(analysisResult);
      if (!analysisResult.success) {
        setError(analysisResult.error || '分析失败');
      }
    } catch (err: any) {
      setError(err.message || '分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载小组列表
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await getGroups();
        setGroups(data);
      } catch (err) {
        console.error('加载小组列表失败:', err);
      }
    };
    if (showCommitSelector) {
      loadGroups();
    }
  }, [showCommitSelector]);

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      if (!selectedGroup) return;
      try {
        const data = await getProjects(selectedGroup.id);
        setProjects(data);
        setSelectedProject(null);
        setCommits([]);
      } catch (err) {
        console.error('加载项目列表失败:', err);
      }
    };
    loadProjects();
  }, [selectedGroup]);

  // 加载提交历史
  useEffect(() => {
    const loadCommits = async () => {
      if (!selectedProject) return;
      setLoadingCommits(true);
      try {
        const data = await getProjectCommits(selectedProject.id);
        setCommits(data);
      } catch (err) {
        console.error('加载提交历史失败:', err);
      } finally {
        setLoadingCommits(false);
      }
    };
    loadCommits();
  }, [selectedProject]);

  // 从提交历史选择文件
  const handleSelectCommitFile = async (fileChange: FileChange) => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      setError(null);
      
      const fileData = await getProjectFile(selectedProject.id, fileChange.file_id);
      if (fileData.content) {
        setContent(fileData.content);
        // 根据文件名判断类型
        const ext = fileData.filename?.split('.').pop()?.toLowerCase() || 'text';
        setFileType(ext === 'md' ? 'text' : ext === 'py' || ext === 'js' || ext === 'ts' ? 'code' : 'text');
        setShowCommitSelector(false);
      } else {
        setError('该文件没有内容');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    // 判断文件类型
    const ext = file.name.split('.').pop()?.toLowerCase();
    const textTypes = ['txt', 'md', 'py', 'js', 'ts', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'];
    
    try {
      // Word文档需要通过后端API提取文本
      if (ext && (ext === 'docx' || ext === 'doc')) {
        const result = await extractFileText(file);
        if (result.success && result.content) {
          setContent(result.content);
          setFileType('document');
        } else {
          setError(result.error || 'Word文档解析失败');
        }
      } else if (ext && textTypes.includes(ext)) {
        // 文本文件，直接读取
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
          setFileType(ext);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('文件读取失败');
          setLoading(false);
        };
        reader.readAsText(file, 'UTF-8');
        return; // 异步读取，提前返回
      } else {
        setError(`暂不支持 ${ext} 格式的文件。请手动输入文本内容，或上传支持的文本文件。`);
      }
    } catch (err: any) {
      setError(err.message || '文件处理失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📄</span>
          文件内容分析
        </h3>
        
        <div className="space-y-4">
          {/* 文件来源选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 上传文件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传文件（可选）
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.md,.py,.js,.ts,.java,.cpp,.c,.html,.css,.json,.xml,.docx,.doc"
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                支持文本文件：.txt, .md, .py, .js 等，以及Word文档：.docx, .doc
              </p>
            </div>

            {/* 从提交历史选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                从小组提交历史选择（可选）
              </label>
              <button
                type="button"
                onClick={() => setShowCommitSelector(!showCommitSelector)}
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                {showCommitSelector ? '▼ 隐藏' : '▶ 选择提交历史中的文件'}
              </button>
            </div>
          </div>

          {/* 提交历史文件选择器 */}
          {showCommitSelector && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">选择文件</h4>
              
              {/* 选择小组 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">选择小组</label>
                <select
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = groups.find(g => g.id === parseInt(e.target.value));
                    setSelectedGroup(group || null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">请选择小组</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              {/* 选择项目 */}
              {selectedGroup && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">选择项目</label>
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const project = projects.find(p => p.id === parseInt(e.target.value));
                      setSelectedProject(project || null);
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">请选择项目</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 提交历史和文件列表 */}
              {selectedProject && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">提交历史中的文件</label>
                  {loadingCommits ? (
                    <div className="text-center py-4 text-sm text-gray-500">加载中...</div>
                  ) : commits.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">暂无提交记录</div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {commits.map(commit => (
                        <div key={commit.id} className="p-3 bg-white rounded border border-gray-200">
                          <div className="text-xs font-medium text-gray-900 mb-2">
                            {commit.message} - v{commits.length - commits.indexOf(commit)}
                          </div>
                          {commit.file_changes && commit.file_changes.length > 0 ? (
                            <div className="space-y-1">
                              {commit.file_changes.map(fileChange => (
                                <button
                                  key={fileChange.id}
                                  onClick={() => handleSelectCommitFile(fileChange)}
                                  className="w-full text-left px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded flex items-center justify-between"
                                >
                                  <span>
                                    {fileChange.file?.filename || `文件 #${fileChange.file_id}`}
                                    <span className="ml-2 text-gray-500">
                                      ({fileChange.change_type === 'add' ? '新增' : fileChange.change_type === 'modify' ? '修改' : '删除'})
                                    </span>
                                  </span>
                                  <span className="text-indigo-600">→</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">该提交无文件变更</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 文件类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件类型
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="text">文本文件</option>
              <option value="code">代码文件</option>
              <option value="document">文档</option>
              <option value="homework">作业/任务</option>
            </select>
          </div>

          {/* 内容输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入文件内容，或上传文件..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {content.length} 字符
            </p>
          </div>

          {/* 分析按钮 */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !content.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                分析中...
              </span>
            ) : (
              '🔍 开始分析'
            )}
          </button>

          {/* 错误提示（带动画） */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
              <p className="text-sm text-red-800 font-medium mb-2 flex items-center">
                <span className="mr-2 animate-bounce">❌</span>
                分析失败
              </p>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                💡 提示：请检查网络连接，或稍后重试。如问题持续，请联系管理员。
              </p>
            </div>
          )}

          {/* 分析结果 */}
          {result && result.success && (
            <div className="mt-6 space-y-4">
              {/* 内容摘要 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">📝</span>
                  内容摘要
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.summary || '暂无摘要'}
                </p>
              </div>

              {/* 时间估计 */}
              {result.estimated_hours !== undefined && result.estimated_hours > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">⏱️</span>
                    预估完成时间
                  </h4>
                  <p className="text-lg font-bold text-green-700">
                    约 {result.estimated_hours} 小时
                  </p>
                </div>
              )}

              {/* 着手建议 */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    着手建议
                  </h4>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-purple-600 font-bold">{index + 1}.</span>
                        <span className="text-sm text-gray-700 leading-relaxed">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileAnalyzer;

