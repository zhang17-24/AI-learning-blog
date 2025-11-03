/**
 * 文本搜索浮动工具栏 - 模仿豆包设计
 */
import { useState, useEffect, useRef } from 'react';

interface TextSearchToolbarProps {
  selectedText: string;
  onClose: () => void;
  position: { x: number; y: number };
}

const TextSearchToolbar = ({ selectedText, onClose, position }: TextSearchToolbarProps) => {
  const [searchQuery, setSearchQuery] = useState(selectedText);

  // 搜索功能
  const handleSearch = () => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery || selectedText)}`;
    window.open(searchUrl, '_blank');
  };

  // 翻译功能
  const handleTranslate = () => {
    // TODO: 实现翻译功能
    window.open(`https://translate.google.com/?sl=auto&tl=zh-CN&text=${encodeURIComponent(selectedText)}`, '_blank');
  };

  // 总结功能
  const handleSummarize = () => {
    // TODO: 实现AI总结功能
    console.log('总结功能待实现');
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 50}px`, // 显示在选中文本上方
        transform: 'translateX(-50%)', // 居中显示
      }}
    >
      {/* 搜索按钮 */}
      <button
        onClick={handleSearch}
        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 text-sm font-medium"
        title="搜索"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>搜索</span>
      </button>

      {/* 翻译按钮 */}
      <button
        onClick={handleTranslate}
        className="px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 text-sm"
        title="翻译"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>翻译</span>
      </button>

      {/* 总结按钮 */}
      <button
        onClick={handleSummarize}
        className="px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2 text-sm"
        title="总结"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>总结</span>
      </button>

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="px-2 py-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        title="关闭"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default TextSearchToolbar;

