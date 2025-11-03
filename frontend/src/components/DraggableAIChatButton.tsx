/**
 * 可拖动的AI伙伴触发按钮
 */
import { useState, useRef, useEffect } from 'react';

interface DraggableAIChatButtonProps {
  onClick: () => void;
}

const DraggableAIChatButton = ({ onClick }: DraggableAIChatButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 80, 
    y: window.innerHeight - 120 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        // 限制在屏幕范围内
        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        
        setPosition(prev => ({
          x: Math.max(0, Math.min(maxX, prev.x + dx)),
          y: Math.max(0, Math.min(maxY, prev.y + dy)),
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // 检查是否是点击而不是拖动
    const clickStartPos = { x: e.clientX, y: e.clientY };
    
    const handleMouseUp = () => {
      const dx = Math.abs(e.clientX - clickStartPos.x);
      const dy = Math.abs(e.clientY - clickStartPos.y);
      
      // 如果移动距离小于5px，认为是点击
      if (dx < 5 && dy < 5) {
        onClick();
      }
      
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    
    // 开始拖动
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      className="absolute bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group cursor-move active:cursor-grabbing"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '56px',
        height: '56px',
      }}
    >
      <span className="text-2xl">🤖</span>
      <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
      
      {/* 拖动提示 */}
      <div className="absolute -left-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
          点击打开 | 拖动移动
        </div>
      </div>
    </button>
  );
};

export default DraggableAIChatButton;

