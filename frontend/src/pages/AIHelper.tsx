/**
 * AI助手页面 - 整合所有AI功能
 */
import { useState } from 'react';
import AIChatApp from '../components/AIChatApp';
import FileAnalyzer from '../components/FileAnalyzer';
import GoalBreakdown from '../components/GoalBreakdown';
import PomodoroTimer from '../components/PomodoroTimer';
import WritingSpace from '../components/WritingSpace';

const AIHelper = () => {
  const [activeTab, setActiveTab] = useState('ai-chat');

  const tabs = [
    { id: 'ai-chat', name: '💬 AI对话', component: <div className="h-[600px]"><AIChatApp /></div> },
    { id: 'file-analyzer', name: '📄 文件分析', component: <FileAnalyzer /> },
    { id: 'goal-breakdown', name: '📚 目标拆解', component: <GoalBreakdown /> },
    { id: 'pomodoro', name: '⏱️ 番茄钟', component: <PomodoroTimer /> },
    { id: 'writing', name: '✍️ 写作空间', component: <div className="h-[600px]"><WritingSpace /></div> },
  ];

  return (
    <div>
      {/* 标签导航 */}
      <div className="bg-white rounded-xl shadow-md p-2 mb-6 border border-gray-100">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div>
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default AIHelper;

