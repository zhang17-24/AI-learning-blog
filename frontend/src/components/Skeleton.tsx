/**
 * 骨架屏组件
 * 用于加载状态时的占位显示，提升用户体验
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// 预定义的骨架屏组合
export const CardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="text" width={80} height={24} />
    </div>
    <Skeleton variant="text" width="100%" height={20} className="mb-2" />
    <Skeleton variant="text" width="60%" height={16} />
  </div>
);

export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg p-4 border border-gray-100 animate-pulse">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={18} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 animate-pulse">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="rectangular"
            width={`${100 / cols}%`}
            height={40}
            className="rounded-lg"
          />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;

