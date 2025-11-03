/**
 * 文本搜索弹窗 - AI分析后给出搜索建议
 */
import { useState } from 'react';
import { analyzeFile } from '../services/ai';

interface TextSearchModalProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const TextSearchModal = ({ selectedText, position, onClose }: TextSearchModalProps) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [searchSuggestion, setSearchSuggestion] = useState<string>('');

  // AI分析文本
  const handleAnalyze = async () => {
    if (!selectedText.trim()) return;

    setLoading(true);
    setAnalysisResult(null);
    setSearchSuggestion('');

    try {
      const result = await analyzeFile(selectedText, 'text');
      
      if (result.success) {
        // 生成搜索建议
        const summary = result.summary || '';
        const suggestions = result.suggestions || [];
        
        // 提取关键词作为搜索建议
        const keywords = selectedText.split(/\s+/).filter(w => w.length > 2).slice(0, 3).join(' ');
        const searchQuery = result.suggestions && result.suggestions.length > 0 
          ? result.suggestions[0].replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
          : keywords;
        
        setSearchSuggestion(searchQuery);
        
        // 构建分析结果
        let analysis = '';
        if (summary) {
          analysis += `📝 **内容摘要**\n${summary}\n\n`;
        }
        if (suggestions.length > 0) {
          analysis += `💡 **关键词**\n${suggestions.slice(0, 3).join(', ')}\n\n`;
        }
        
        setAnalysisResult(analysis);
      } else {
        setAnalysisResult(`❌ 分析失败：${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      setAnalysisResult(`❌ 分析失败：${error.message || '网络错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 在浏览器中搜索
  const handleSearch = (query?: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query || searchSuggestion || selectedText)}`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 280}px`, // 显示在选中文本上方
        transform: 'translateX(-50%)', // 居中显示
        width: '400px',
        maxHeight: '500px',
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">AI文本搜索助手</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 选中的文本 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
        <div className="text-xs font-semibold text-gray-600 mb-1">选中的文本：</div>
        <div className="text-sm text-gray-800 leading-relaxed line-clamp-2">{selectedText}</div>
      </div>

      {/* AI分析按钮 */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center mb-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            AI正在分析中...
          </>
        ) : (
          <>🤖 使用AI分析内容</>
        )}
      </button>

      {/* AI分析结果 */}
      {analysisResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="text-xs font-semibold text-blue-800 mb-2">AI分析结果：</div>
          <div className="text-xs text-blue-900 whitespace-pre-wrap leading-relaxed">{analysisResult}</div>
        </div>
      )}

      {/* 搜索建议 */}
      {searchSuggestion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="text-xs font-semibold text-green-800 mb-2">建议搜索：</div>
          <div className="text-sm text-green-900 mb-3">{searchSuggestion}</div>
          <button
            onClick={() => handleSearch()}
            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            在Google中搜索
          </button>
        </div>
      )}

      {/* 底部操作 */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default TextSearchModal;
