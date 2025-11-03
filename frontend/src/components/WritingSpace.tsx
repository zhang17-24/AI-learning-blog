/**
 * 写作空间组件 - 支持数据库存储和历史记录
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeFile, chatWithAI, extractFileText } from '../services/ai';
import {
  getWritingSessions,
  createWritingSession,
  deleteWritingSession,
  clearAllWritingSessions,
  getWritingItems,
  saveWritingItem,
  updateWritingItem,
  deleteWritingItem,
} from '../services/writing';
import type { WritingSession, WritingItem } from '../services/writing';

interface LocalWritingItem {
  id: string;
  type: 'text' | 'image';
  content: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

const WritingSpace = () => {
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [items, setItems] = useState<LocalWritingItem[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [translationResult, setTranslationResult] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const autoSaveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const result = await getWritingSessions();
      if (result.success && result.sessions) {
        setSessions(result.sessions);
        if (result.sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(result.sessions[0].id);
        }
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  };

  // 加载当前会话的项目
  const loadItems = async (sessionId: number) => {
    try {
      const result = await getWritingItems(sessionId);
      if (result.success && result.items) {
        setItems(result.items.map(item => ({
          id: item.id.toString(),
          type: item.item_type,
          content: item.content || '',
          title: item.title,
          position: { x: item.position_x, y: item.position_y },
          size: { width: item.width, height: item.height },
        })));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
      setItems([]);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadItems(currentSessionId);
    } else {
      setItems([]);
    }
  }, [currentSessionId]);

  // 保存项目到数据库
  const handleSaveItem = useCallback(async (item: LocalWritingItem) => {
    try {
      const itemId = parseInt(item.id);
      
      // 判断是否为数据库ID：数据库ID通常是较小的整数（<1000000）
      // Date.now()生成的是13位数字（>1000000000000），不是数据库ID
      const isDatabaseId = !isNaN(itemId) && itemId < 1000000;
      
      if (isDatabaseId) {
        // 更新现有项目
        const result = await updateWritingItem(itemId, {
          title: item.title || '未命名',
          content: item.content,
          position_x: item.position.x,
          position_y: item.position.y,
          width: item.size.width,
          height: item.size.height,
        });
        
        if (!result.success) {
          console.error('更新项目失败:', result.error);
        }
      } else {
        // 新项目，需要创建
        if (!currentSessionId) {
          // 先创建会话
          const sessionResult = await createWritingSession('未命名文档');
          if (sessionResult.success && sessionResult.session) {
            setCurrentSessionId(sessionResult.session.id);
            setSessions(prev => [sessionResult.session!, ...prev]);
            
            // 会话创建成功后，再用新ID保存项目
            const result = await saveWritingItem({
              session_id: sessionResult.session.id,
              title: item.title || '未命名',
              content: item.content,
              item_type: item.type,
              position_x: item.position.x,
              position_y: item.position.y,
              width: item.size.width,
              height: item.size.height,
            });
            
            if (result.success && result.item) {
              // 更新本地item的ID
              setItems(prev => prev.map(i => 
                i.id === item.id 
                  ? { ...i, id: result.item!.id.toString() }
                  : i
              ));
            }
          }
        } else {
          // 已有会话，直接保存
          const result = await saveWritingItem({
            session_id: currentSessionId,
            title: item.title || '未命名',
            content: item.content,
            item_type: item.type,
            position_x: item.position.x,
            position_y: item.position.y,
            width: item.size.width,
            height: item.size.height,
          });
          
          if (result.success && result.item) {
            // 更新本地item的ID
            setItems(prev => prev.map(i => 
              i.id === item.id 
                ? { ...i, id: result.item!.id.toString() }
                : i
            ));
          }
        }
      }
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  }, [currentSessionId, sessions]);

  // 自动保存
  const scheduleAutoSave = useCallback((itemId: string, currentItems: LocalWritingItem[]) => {
    // 清除之前的定时器
    if (autoSaveTimers.current[itemId]) {
      clearTimeout(autoSaveTimers.current[itemId]);
    }
    
    // 设置新的定时器
    autoSaveTimers.current[itemId] = setTimeout(() => {
      const item = currentItems.find(i => i.id === itemId);
      if (item) {
        handleSaveItem(item);
      }
    }, 2000); // 2秒后自动保存
  }, [handleSaveItem]);

  // 新建会话
  const handleNewSession = async () => {
    const result = await createWritingSession('未命名文档');
    if (result.success && result.session) {
      setSessions(prev => [result.session!, ...prev]);
      setCurrentSessionId(result.session.id);
      setItems([]);
    }
  };

  // 删除会话
  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm('确定要删除这个文档吗？')) {
      const result = await deleteWritingSession(sessionId);
      if (result.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          const remainingSessions = sessions.filter(s => s.id !== sessionId);
          setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
        }
      }
    }
  };

  // 清空所有会话
  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有文档吗？')) {
      const result = await clearAllWritingSessions();
      if (result.success) {
        setSessions([]);
        setCurrentSessionId(null);
        setItems([]);
      }
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        // 图片文件
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const newItem: LocalWritingItem = {
            id: Date.now().toString(),
            type: 'image',
            content: imageUrl,
            title: file.name,
            position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
            size: { width: 300, height: 200 },
          };
          setItems((prev) => [...prev, newItem]);
          scheduleAutoSave(newItem.id, [...items, newItem]);
        };
        reader.readAsDataURL(file);
      } else if (
        file.type.startsWith('text/') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.txt') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.doc')
      ) {
        // 文本文件或Word文档
        try {
          if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            // Word文档，使用提取API
            const result = await extractFileText(file);
            if (result.success && result.content) {
              const newItem: LocalWritingItem = {
                id: Date.now().toString(),
                type: 'text',
                content: result.content,
                title: result.filename || file.name,
                position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                size: { width: 400, height: 300 },
              };
              setItems((prev) => [...prev, newItem]);
              scheduleAutoSave(newItem.id, [...items, newItem]);
            }
          } else {
            // 普通文本文件
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = e.target?.result as string;
              const newItem: LocalWritingItem = {
                id: Date.now().toString(),
                type: 'text',
                content: text,
                title: file.name,
                position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                size: { width: 400, height: 300 },
              };
              setItems((prev) => [...prev, newItem]);
              scheduleAutoSave(newItem.id, [...items, newItem]);
            };
            reader.readAsText(file);
          }
        } catch (error: any) {
          console.error('文件处理失败:', error);
          alert(`文件处理失败：${error.message}`);
        }
      }
    }

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理文本选择
  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    setSelectedText(text);
  };

  // AI翻译
  const handleTranslate = async () => {
    if (!selectedText) {
      alert('请先选择要翻译的文本');
      return;
    }

    setIsTranslating(true);
    setTranslationResult('');
    setSummaryResult('');

    try {
      const result = await chatWithAI(
        `请将以下文本翻译成简体中文：\n\n${selectedText}`,
        [],
        currentSessionId || undefined
      );

      if (result.success && result.reply) {
        setTranslationResult(result.reply);
      } else {
        setTranslationResult(`翻译失败：${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      setTranslationResult(`翻译失败：${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // AI总结
  const handleSummarize = async () => {
    if (!selectedText) {
      alert('请先选择要总结的文本');
      return;
    }

    setIsSummarizing(true);
    setSummaryResult('');
    setTranslationResult('');

    try {
      const result = await chatWithAI(
        `请总结以下文本的主要内容，不超过100字：\n\n${selectedText}`,
        [],
        currentSessionId || undefined
      );

      if (result.success && result.reply) {
        setSummaryResult(result.reply);
      } else {
        setSummaryResult(`总结失败：${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      setSummaryResult(`总结失败：${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // 搜索选中文本
  const handleSearch = () => {
    if (!selectedText) {
      alert('请先选择要搜索的文本');
      return;
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
    window.open(searchUrl, '_blank');
  };

  // 删除项目
  const handleDelete = async (itemId: string) => {
    const id = parseInt(itemId);
    const isDatabaseId = !isNaN(id) && id < 1000000;
    
    if (isDatabaseId) {
      const result = await deleteWritingItem(id);
      if (result.success) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // 创建新文本
  const handleNewText = () => {
    const newItem: LocalWritingItem = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
      title: '未命名',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      size: { width: 400, height: 300 },
    };
    setItems((prev) => [...prev, newItem]);
  };

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;
    
    e.preventDefault();
    // 直接使用itemId字符串，不需要转换为数字
    setDraggedItem(itemId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // 监听鼠标移动和抬起
  useEffect(() => {
    if (draggedItem !== null) {
      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        setItems((prev) =>
          prev.map((item) => {
            if (item.id === draggedItem) {
              // 计算新位置，防止拖出左边界和上边界
              const newX = Math.max(0, item.position.x + dx);
              const newY = Math.max(0, item.position.y + dy);
              
              const updatedItem = {
                ...item,
                position: {
                  x: newX,
                  y: newY,
                },
              };
              scheduleAutoSave(updatedItem.id, prev);
              return updatedItem;
            }
            return item;
          })
        );

        setDragStart({ x: e.clientX, y: e.clientY });
      };

      const handleMouseUp = () => {
        setDraggedItem(null);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedItem, dragStart, scheduleAutoSave]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧历史记录栏 */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">✍️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">写作空间</h3>
              <p className="text-xs text-gray-500">文档管理</p>
            </div>
          </div>
          
          {/* 新建文档按钮 */}
          <button
            onClick={handleNewSession}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新建文档</span>
          </button>
        </div>

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              暂无文档<br />开始新建吧
            </div>
          ) : (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">历史文档</div>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group relative px-3 py-2 rounded-lg transition-colors"
                >
                  <button
                    onClick={() => setCurrentSessionId(session.id)}
                    className={`w-full text-left ${currentSessionId === session.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <div className="font-medium text-sm truncate">{session.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(session.updated_at).toLocaleString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </button>
                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-3 border-t border-gray-200">
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              清空所有记录
            </button>
          )}
        </div>
      </div>

      {/* 右侧编辑区域 */}
      <div className="flex-1 flex flex-col bg-white">
        {/* 工具栏 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 border-b border-indigo-200">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">
              {sessions.find(s => s.id === currentSessionId)?.name || '未选择文档'}
            </h3>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.txt,.md,.doc,.docx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                📁 上传文件
              </label>
              <button
                onClick={handleNewText}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                📝 新建文本
              </button>
            </div>
          </div>
        </div>

        {/* 操作栏 */}
        {selectedText && (
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isTranslating ? '翻译中...' : '🌐 翻译'}
              </button>
              <button
                onClick={handleSearch}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                🔍 搜索
              </button>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {isSummarizing ? '总结中...' : '📊 总结'}
              </button>
              <span className="text-xs text-gray-500 ml-2">已选择：{selectedText.length} 字符</span>
            </div>
          </div>
        )}

        {/* 结果展示区域 */}
        {(translationResult || summaryResult) && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            {translationResult && (
              <div className="mb-2">
                <div className="text-xs font-medium text-gray-600 mb-1">🌐 翻译结果：</div>
                <div className="text-sm text-gray-900 bg-white rounded p-3">{translationResult}</div>
              </div>
            )}
            {summaryResult && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">📊 总结结果：</div>
                <div className="text-sm text-gray-900 bg-white rounded p-3">{summaryResult}</div>
              </div>
            )}
            <button
              onClick={() => {
                setTranslationResult('');
                setSummaryResult('');
                setSelectedText('');
              }}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              ✕ 清除结果
            </button>
          </div>
        )}

        {/* 画布区域 */}
        <div className="flex-1 overflow-auto bg-gray-50 relative p-6" onMouseUp={handleTextSelect}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">点击上方按钮上传文件或创建新文本</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="absolute bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                  style={{
                    left: item.position.x,
                    top: item.position.y,
                    width: item.size.width,
                    height: item.size.height,
                  }}
                >
                  {/* 标题栏 - 可拖动 */}
                  <div
                    className="drag-handle bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between cursor-move hover:bg-gray-100 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, item.id)}
                  >
                    <span className="text-xs text-gray-600 truncate flex-1 mr-2">
                      {item.title || '未命名'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* 内容区域 */}
                  <div className="p-3 overflow-auto" style={{ height: item.size.height - 40 }}>
                    {item.type === 'image' ? (
                      <img src={item.content} alt={item.title} className="w-full h-auto" />
                    ) : (
                      <textarea
                        value={item.content}
                        onChange={(e) => {
                          setItems((prev) => {
                            const updated = prev.map((i) => 
                              (i.id === item.id ? { ...i, content: e.target.value } : i)
                            );
                            scheduleAutoSave(item.id, updated);
                            return updated;
                          });
                        }}
                        className="w-full h-full border-none outline-none resize-none text-sm"
                        placeholder="开始输入你的内容..."
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingSpace;
