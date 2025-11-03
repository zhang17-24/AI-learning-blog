/**
 * AI伙伴聊天窗口 - 可拖动和调整大小
 */
import { useState, useRef, useEffect } from 'react';
import AIChat from './AIChat';

interface AIChatWindowProps {
  onClose: () => void;
}

const AIChatWindow = ({ onClose }: AIChatWindowProps) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 拖动处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPosition(prev => ({
          x: Math.max(0, Math.min(window.innerWidth - size.width, prev.x + dx)),
          y: Math.max(0, Math.min(window.innerHeight - 100, prev.y + dy)),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        setSize({
          width: Math.max(400, Math.min(800, resizeStart.width + dx)),
          height: Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + dy)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  return (
    <div
      ref={windowRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {/* 拖动条 */}
      <div
        className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 cursor-move flex items-center justify-between select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-indigo-600 text-sm font-bold">AI</span>
          </div>
          <span className="text-white font-semibold">AI伙伴</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 聊天内容 */}
      <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 3rem)' }}>
        <AIChat />
      </div>

      {/* 调整大小控制点 - 右下角 */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group"
        onMouseDown={handleResizeMouseDown}
      >
        {/* 调整大小指示器 */}
        <div className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end">
          <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AIChatWindow;

