/**
 * 鼓掌手组件 - 带交互特效
 * 鼠标悬停：弹动动画
 * 点击：烟花特效
 */
import { useState, useRef, useEffect } from 'react';

interface ClappingHandProps {
  size?: number; // emoji大小
  className?: string;
}

const ClappingHand = ({ size = 40, className = '' }: ClappingHandProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  // 生成烟花粒子
  const createFireworks = (x: number, y: number) => {
    const newParticles: Array<{ id: number; x: number; y: number; angle: number }> = [];
    const particleCount = 12; // 烟花粒子数量
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        angle,
      });
    }
    
    setParticles(newParticles);
    
    // 清除粒子（动画结束后）
    setTimeout(() => {
      setParticles([]);
    }, 1000);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    createFireworks(centerX, centerY);
  };

  return (
    <div
      ref={containerRef}
      className={`inline-block relative cursor-pointer select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        transform: isHovered ? 'scale(1.15) rotate(-10deg)' : 'scale(1) rotate(0deg)',
        transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      }}
    >
      {/* 鼓掌emoji */}
      <span
        className="inline-block"
        style={{
          fontSize: `${size}px`,
          display: 'inline-block',
          animation: isHovered ? 'clap-bounce 0.8s ease-in-out infinite' : 'none',
        }}
      >
        👏
      </span>
      
      <style>{`
        @keyframes clap-bounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          15% {
            transform: translateY(-12px) rotate(-15deg) scale(1.15);
          }
          30% {
            transform: translateY(-5px) rotate(12deg) scale(1.08);
          }
          45% {
            transform: translateY(-10px) rotate(-8deg) scale(1.12);
          }
          60% {
            transform: translateY(-3px) rotate(6deg) scale(1.05);
          }
          75% {
            transform: translateY(-8px) rotate(-4deg) scale(1.1);
          }
          90% {
            transform: translateY(-2px) rotate(2deg) scale(1.02);
          }
        }
      `}</style>

      {/* 烟花粒子效果 */}
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          startX={particle.x}
          startY={particle.y}
          angle={particle.angle}
        />
      ))}
    </div>
  );
};

// 烟花粒子组件
const Particle = ({ startX, startY, angle }: { startX: number; startY: number; angle: number }) => {
  const [position, setPosition] = useState({ x: startX, y: startY });
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const duration = 1000; // 动画持续时间
    const distance = 80; // 粒子飞行的距离
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 抛物线运动
      const t = progress;
      const currentDistance = distance * t;
      const x = startX + Math.cos(angle) * currentDistance;
      const y = startY + Math.sin(angle) * currentDistance - 100 * t * (1 - t); // 添加重力效果

      setPosition({ x, y });
      setOpacity(1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [startX, startY, angle]);

  // 随机颜色
  const colors = ['#FFD700', '#FF6347', '#FF1493', '#00CED1', '#9370DB', '#FF69B4'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}, ${color}cc)`,
        boxShadow: `0 0 15px ${color}, 0 0 8px ${color}88`,
        opacity,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        transition: 'opacity 0.15s ease-out',
      }}
    />
  );
};

export default ClappingHand;
