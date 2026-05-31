import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Search, RefreshCw, Eye, Calendar, Image, X } from 'lucide-react';

interface AdminPanelProps {
  authToken: string;
  onInspectUser: (phone: string) => void;
  activeInspectedUser: string | null;
  onExitInspect: () => void;
  onClose: () => void;
}

interface UserSummary {
  phone: string;
  registeredAt: string;
  cardCount: number;
}

export default function AdminPanel({
  authToken,
  onInspectUser,
  activeInspectedUser,
  onExitInspect,
  onClose
}: AdminPanelProps) {
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/users-list', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(data.users || []);
      } else {
        setErrorMsg(data.message || '获取注册账号列表权益不足');
      }
    } catch (err) {
      setErrorMsg('系统网络异常，无法同步账号列表');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [authToken]);

  const filteredUsers = usersList.filter(u => 
    u.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-pink-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)] flex flex-col max-h-[85vh]">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-pink-900/40 via-purple-950/30 to-zinc-900 px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-pink-500/20 p-2 border border-pink-500/40 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-pink-100 flex items-center gap-2">
                管理员控制中心 <span className="text-[10px] bg-pink-500/20 border border-pink-500/30 text-pink-400 px-1.5 py-0.5 rounded-full font-mono">syx666</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                实时云端账号分析器 & 独立沙盒沙盘查看工具
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search and Action Bar */}
        <div className="p-4 bg-zinc-900/50 border-b border-white/5 flex gap-2 items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="搜索手机号/注册账号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/10"
            />
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
              title="刷新账号列表"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {activeInspectedUser && (
              <button
                onClick={onExitInspect}
                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl transition-all"
              >
                退出调试模式
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {errorMsg ? (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-xs text-center">
              ⚠️ {errorMsg}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-serif italic">
              {isLoading ? '加载账户数据中...' : '暂无对应的注册账号数据'}
            </div>
          ) : (
            <div className="border border-white/5 rounded-xl overflow-hidden bg-zinc-950">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-white/5 text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                    <th className="px-4 py-3">账号/手机号</th>
                    <th className="px-4 py-3">注册日期</th>
                    <th className="px-4 py-3">回忆相片数</th>
                    <th className="px-4 py-3 text-right">沙盒访问</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                  {filteredUsers.map((user) => {
                    const isCurrentUser = activeInspectedUser === user.phone;
                    return (
                      <tr 
                        key={user.phone} 
                        className={`hover:bg-white/[0.02] transition-colors duration-150 ${isCurrentUser ? 'bg-pink-500/5' : ''}`}
                      >
                        <td className="px-4 py-3.5 font-sans font-bold flex items-center gap-2">
                          <span className={`${isCurrentUser ? 'text-pink-400' : 'text-zinc-200'}`}>
                            {user.phone}
                          </span>
                          {user.phone === 'admin' && (
                            <span className="text-[9px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 px-1 rounded">ADMIN</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px] flex-inline items-center gap-1.5">
                          <Calendar className="h-3 w-3 inline text-zinc-500 -mt-0.5 mr-1" />
                          {user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : '未知'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-zinc-300">
                          <span className="inline-flex items-center gap-1 font-bold text-sky-400">
                            <Image className="h-3 w-3 text-sky-500/60" />
                            {user.cardCount} 张
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isCurrentUser ? (
                            <span className="text-[10px] text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 animate-pulse">
                              <Eye className="h-3.5 w-3.5" /> 正在调试中
                            </span>
                          ) : (
                            <button
                              onClick={() => onInspectUser(user.phone)}
                              className="bg-zinc-900 hover:bg-pink-500/15 border border-zinc-800 hover:border-pink-500/30 text-zinc-300 hover:text-pink-300 text-[10px] uppercase font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Eye className="h-3 w-3" /> 调试沙盒
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Statistics */}
        <div className="bg-zinc-900 border-t border-white/5 p-4 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <div className="flex gap-4">
            <span>总账户数: <b className="text-zinc-200">{usersList.length}</b></span>
            <span>当前沙盒: <b className="text-pink-400">{activeInspectedUser || '主管理员沙盒'}</b></span>
          </div>
          <span>Secure Isolation Console</span>
        </div>
        
      </div>
    </div>
  );
}
