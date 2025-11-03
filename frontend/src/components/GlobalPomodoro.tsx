/**
 * 全局番茄钟组件 - 左下角浮动
 */
import { useState, useEffect, useRef } from 'react';

interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number; // 剩余秒数
  sessionType: 'work' | 'rest'; // 工作或休息
  workDuration: number; // 工作时间（分钟）
  restDuration: number; // 休息时间（分钟）
}

const GlobalPomodoro = () => {
  const [state, setState] = useState<PomodoroState>({
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60, // 默认25分钟
    sessionType: 'work',
    workDuration: 25,
    restDuration: 5,
  });

  const [completedCount, setCompletedCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [customWork, setCustomWork] = useState('');
  const [customRest, setCustomRest] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 启动倒计时
  const startTimer = () => {
    setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  };

  // 暂停倒计时
  const pauseTimer = () => {
    setState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
  };

  // 停止倒计时
  const stopTimer = () => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      timeLeft: prev.workDuration * 60,
      sessionType: 'work',
    }));
  };

  // 倒计时逻辑
  useEffect(() => {
    if (state.isRunning && state.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft === 0) {
            // 时间到，切换会话类型
            const newSessionType = prev.sessionType === 'work' ? 'rest' : 'work';
            const newTime = newSessionType === 'work' ? prev.workDuration * 60 : prev.restDuration * 60;
            
            // 如果完成一个工作周期，增加计数
            if (prev.sessionType === 'work') {
              setCompletedCount((count) => count + 1);
              
              // 显示通知
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🍅 学习时间到！', {
                  body: '是时候休息一下了～',
                  icon: '/favicon.ico',
                });
              }
            } else {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🎉 休息结束', {
                  body: '准备好开始下一轮学习了吗？',
                  icon: '/favicon.ico',
                });
              }
            }
            
            return {
              ...prev,
              timeLeft: newTime,
              sessionType: newSessionType,
              isRunning: false,
              isPaused: false,
            };
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.timeLeft]);

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const progress = () => {
    const total = state.sessionType === 'work' ? state.workDuration * 60 : state.restDuration * 60;
    return ((total - state.timeLeft) / total) * 100;
  };

  // 更新时间设置
  const updateDuration = (type: 'work' | 'rest', minutes: number) => {
    if (!state.isRunning) {
      setState((prev) => ({
        ...prev,
        [type === 'work' ? 'workDuration' : 'restDuration']: minutes,
        timeLeft: prev.sessionType === type ? minutes * 60 : prev.timeLeft,
      }));
    }
  };

  // 自定义时长
  const applyCustomDuration = () => {
    const workMin = parseInt(customWork);
    const restMin = parseInt(customRest);
    
    if (workMin && workMin > 0 && workMin <= 120) {
      setState(prev => ({ ...prev, workDuration: workMin }));
    }
    if (restMin && restMin > 0 && restMin <= 60) {
      setState(prev => ({ ...prev, restDuration: restMin }));
    }
    setCustomWork('');
    setCustomRest('');
  };

  // 只有在运行中或暂停时才显示
  if (!state.isRunning && !state.isPaused) {
    return null;
  }

  return (
    <div className="fixed left-6 bottom-6 z-50">
      {!expanded ? (
        // 收缩状态 - 小圆圈
        <button
          onClick={() => setExpanded(true)}
          className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative group"
        >
          {/* 进度圆圈 */}
          <svg className="w-full h-full absolute transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress() / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-white text-lg font-bold z-10">{state.sessionType === 'work' ? '📚' : '☕'}</span>
          
          {/* 提示 */}
          <div className="absolute left-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
              点击展开控制
            </div>
          </div>
        </button>
      ) : (
        // 展开状态 - 控制面板
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">🍅 番茄钟</h3>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 状态显示 */}
          <div className="text-center mb-3">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatTime(state.timeLeft)}
            </div>
            <div className="text-xs text-gray-500">
              {state.sessionType === 'work' ? '📚 学习时间' : '☕ 休息时间'}
            </div>
            <div className="text-xs text-gray-400 mt-1">今日完成 {completedCount} 个</div>
          </div>

          {/* 控制按钮 */}
          <div className="flex space-x-2">
            {state.isRunning ? (
              <button
                onClick={pauseTimer}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-all"
              >
                ⏸ 暂停
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all"
              >
                ▶ 继续
              </button>
            )}
            <button
              onClick={stopTimer}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all"
            >
              ⏹ 停止
            </button>
          </div>

          {/* 自定义时长 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2 font-medium">自定义时长（分钟）</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="学习"
                  value={customWork}
                  onChange={(e) => setCustomWork(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  placeholder="休息"
                  value={customRest}
                  onChange={(e) => setCustomRest(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            {(customWork || customRest) && (
              <button
                onClick={applyCustomDuration}
                className="mt-2 w-full px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-all"
              >
                应用设置
              </button>
            )}
          </div>

          {/* 快速设置 */}
          <div className="mt-3 grid grid-cols-4 gap-1">
            {[15, 25, 30, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => updateDuration('work', mins)}
                disabled={state.isRunning}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  state.workDuration === mins
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {mins}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalPomodoro;

