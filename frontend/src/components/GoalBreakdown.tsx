/**
 * 学习目标拆解组件
 */
import { useState } from 'react';
import { breakDownGoal } from '../services/ai';
import type { GoalBreakdownResult } from '../services/ai';

const GoalBreakdown = () => {
  const [goalDescription, setGoalDescription] = useState('');
  const [knowledgeBackground, setKnowledgeBackground] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoalBreakdownResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBreakDown = async () => {
    if (!goalDescription.trim()) {
      setError('请输入学习目标');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const breakdownResult = await breakDownGoal(goalDescription, knowledgeBackground);
      setResult(breakdownResult);
      if (!breakdownResult.success) {
        setError(breakdownResult.error || '拆解失败');
      }
    } catch (err: any) {
      setError(err.message || '拆解失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 学习目标拆解</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              学习目标 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="例如：学习Python数据分析，掌握Pandas库的使用..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              知识背景（可选）
            </label>
            <textarea
              value={knowledgeBackground}
              onChange={(e) => setKnowledgeBackground(e.target.value)}
              placeholder="请描述你的相关背景，帮助AI更好地设计学习路径..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleBreakDown}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>拆解中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>开始拆解</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 结果展示 */}
      {result && result.success && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✨ 推荐学习路径</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {result.learning_path || 'AI已为您定制了学习路径'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 学习步骤</h3>
            <div className="space-y-4">
              {result.steps && result.steps.length > 0 ? (
                result.steps.map((step, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold">
                        {step.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                          {step.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ⏱️ {step.estimated_time}
                          </span>
                          {step.prerequisites && step.prerequisites.length > 0 && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              📚 前置：{step.prerequisites.join('、')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">暂无学习步骤</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalBreakdown;

