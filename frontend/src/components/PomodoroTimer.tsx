/**
 * 番茄钟学习空间组件
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

const PomodoroTimer = () => {
  const [state, setState] = useState<PomodoroState>({
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60, // 默认25分钟
    sessionType: 'work',
    workDuration: 25,
    restDuration: 5,
  });

  const [completedCount, setCompletedCount] = useState(0);
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

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* 状态显示 */}
      <div className="text-center">
        <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-2">
          {state.sessionType === 'work' ? '📚 学习时间' : '☕ 休息时间'}
        </div>
        <p className="text-gray-600 text-sm">今日已完成 {completedCount} 个番茄</p>
      </div>

      {/* 圆形进度条 */}
      <div className="relative w-64 h-64">
        <svg className="w-full h-full transform -rotate-90">
          {/* 背景圆 */}
          <circle
            cx="128"
            cy="128"
            r="116"
            stroke={state.sessionType === 'work' ? '#e0e7ff' : '#fef3c7'}
            strokeWidth="8"
            fill="none"
          />
          {/* 进度圆 */}
          <circle
            cx="128"
            cy="128"
            r="116"
            stroke={state.sessionType === 'work' ? '#6366f1' : '#f59e0b'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 116}`}
            strokeDashoffset={`${2 * Math.PI * 116 * (1 - progress() / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        
        {/* 时间显示 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {formatTime(state.timeLeft)}
            </div>
            <div className="text-sm text-gray-500">
              {state.isRunning ? '⏸ 进行中' : state.isPaused ? '⏸ 已暂停' : '⏹ 已停止'}
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex space-x-4">
        {!state.isRunning && !state.isPaused ? (
          <button
            onClick={startTimer}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            ▶ 开始
          </button>
        ) : (
          <>
            {state.isRunning ? (
              <button
                onClick={pauseTimer}
                className="px-8 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-all duration-200 shadow-lg"
              >
                ⏸ 暂停
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="px-8 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 shadow-lg"
              >
                ▶ 继续
              </button>
            )}
            <button
              onClick={stopTimer}
              className="px-8 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 shadow-lg"
            >
              ⏹ 停止
            </button>
          </>
        )}
      </div>

      {/* 时间设置 */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">📚 学习时长（分钟）</label>
          <div className="flex space-x-2">
            {[15, 25, 30, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => updateDuration('work', mins)}
                disabled={state.isRunning}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.workDuration === mins
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {mins}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">☕ 休息时长（分钟）</label>
          <div className="flex space-x-2">
            {[3, 5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => updateDuration('rest', mins)}
                disabled={state.isRunning}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.restDuration === mins
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {mins}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;

