import { useState, useEffect } from 'react';
import {
  getGroups,
  createGroup,
  getGroupMembers,
  joinGroupByKey,
  removeGroupMember,
} from '../services/groups';
import { useAuth } from '../contexts/AuthContext';
import GroupDetail from '../components/GroupDetail';
import type { Group, GroupMember } from '../types';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
  });
  
  const [joinFormData, setJoinFormData] = useState({
    join_key: '',
  });

  // 加载小组列表
  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await getGroups();
      setGroups(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载小组失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载成员列表
  const loadMembers = async (groupId: number) => {
    try {
      const data = await getGroupMembers(groupId);
      setMembers(data);
    } catch (err: any) {
      console.error('加载成员失败:', err);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // 创建小组
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGroup = await createGroup(createFormData);
      setGroups([...groups, newGroup]);
      setShowCreateForm(false);
      setCreateFormData({ name: '', description: '' });
      setSuccess('小组创建成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建小组失败');
    }
  };

  // 加入小组
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const joinedGroup = await joinGroupByKey(joinFormData.join_key);
      setGroups([...groups, joinedGroup]);
      setShowJoinForm(false);
      setJoinFormData({ join_key: '' });
      setSuccess('成功加入小组！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '加入小组失败');
    }
  };

  // 复制密钥
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccess('密钥已复制到剪贴板！');
    setTimeout(() => setSuccess(null), 2000);
  };

  // 移除成员
  const handleRemoveMember = async (memberId: number) => {
    if (!selectedGroup) return;
    if (!window.confirm('确定要移除该成员吗？')) return;

    try {
      const member = members.find(m => m.id === memberId);
      if (member) {
        await removeGroupMember(selectedGroup.id, member.user_id);
        await loadMembers(selectedGroup.id);
        await loadGroups();
        setSuccess('成员已移除');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '移除成员失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 提示消息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ✨ 创建小组
        </button>
        <button
          onClick={() => setShowJoinForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          🔗 加入小组
        </button>
      </div>

      {/* 创建小组表单 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-bounce-in border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">创建小组</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小组名称 *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小组描述
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 加入小组表单 */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-bounce-in border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">加入小组</h3>
            <form onSubmit={handleJoinGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入密钥 *
                </label>
                <input
                  type="text"
                  value={joinFormData.join_key}
                  onChange={(e) => setJoinFormData({ ...joinFormData, join_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="输入小组密钥"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  加入
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 小组列表 */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-5xl mb-3">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有加入任何小组</h3>
          <p className="text-sm text-gray-600">创建新小组或通过密钥加入现有小组</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                {group.creator_id === user?.id && (
                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    我创建的
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  👥 {group.member_count || 0} 名成员
                </span>
                <div className="flex gap-2">
                  {group.join_key && (
                    <button
                      onClick={() => copyKey(group.join_key!)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      📋 密钥
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      loadMembers(group.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    👥 成员
                  </button>
                  <button
                    onClick={() => setSelectedGroupForDetail(group)}
                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                  >
                    🚀 进入
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 成员详情弹窗 */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl animate-bounce-in border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedGroup.name} - 成员列表
              </h3>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.username || '未知用户'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.role === 'admin' ? '👑 管理员' : '成员'}
                      </p>
                    </div>
                  </div>
                  {selectedGroup.creator_id === user?.id && member.user_id !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      移除
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 小组详情弹窗 */}
      {selectedGroupForDetail && (
        <GroupDetail
          group={selectedGroupForDetail}
          onClose={() => {
            setSelectedGroupForDetail(null);
            loadGroups(); // 刷新小组列表
          }}
        />
      )}
    </div>
  );
};

export default Groups;

