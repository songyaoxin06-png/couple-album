import React, { useState } from 'react';
import { Heart, Sparkles, Key, Phone, Lock, LogIn, UserPlus, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (token: string, phone: string, role: 'user' | 'admin', userConfig?: any, userMemories?: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setAdminKey('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleTabChange = (tab: 'login' | 'register' | 'admin') => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (activeTab === 'register') {
      if (!phone.trim()) {
        setErrorMessage('请输入手机号');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('密码长度至少为 6 位');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('两次输入的密码不一致');
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });
        const data = await res.json();
        setIsLoading(false);

        if (!res.ok || !data.success) {
          setErrorMessage(data.message || '注册失败，请稍后重试');
        } else {
          setSuccessMessage('注册成功！正在为您自动登录...');
          // Proceed to auto login after register
          setTimeout(() => {
            handleLoginFlow(phone, password);
          }, 1200);
        }
      } catch (err) {
        setIsLoading(false);
        setErrorMessage('网络连接失败，请检查服务器连接');
      }
    } else if (activeTab === 'login') {
      if (!phone.trim()) {
        setErrorMessage('请输入手机号');
        return;
      }
      if (!password) {
        setErrorMessage('请输入密码');
        return;
      }
      handleLoginFlow(phone, password);
    } else if (activeTab === 'admin') {
      if (!adminKey) {
        setErrorMessage('请输入管理员密钥');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminKey }),
        });
        const data = await res.json();
        setIsLoading(false);

        if (!res.ok || !data.success) {
          setErrorMessage(data.message || '管理员密钥错误');
        } else {
          // Admin log-in fetch custom config if returned
          localStorage.setItem('couple_token', data.token);
          // Load admin profile configuration
          await fetchAndTriggerSuccess(data.token, 'admin');
        }
      } catch (err) {
        setIsLoading(false);
        setErrorMessage('网络连接失败');
      }
    }
  };

  const handleLoginFlow = async (uPhone: string, uPass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: uPhone, password: uPass }),
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || '手机号或密码不正确');
      } else {
        localStorage.setItem('couple_token', data.token);
        await fetchAndTriggerSuccess(data.token, uPhone);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('网络连接失败');
    }
  };

  const fetchAndTriggerSuccess = async (token: string, phoneId: string) => {
    try {
      const raw = await fetch('/api/user/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await raw.json();
      if (res.success) {
        onLoginSuccess(
          token,
          res.data.phone,
          res.data.role,
          res.data.config,
          res.data.memories
        );
      } else {
        setErrorMessage('获取云端配置数据失败');
      }
    } catch (e) {
      setErrorMessage('初始化云数据错误');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#06020c] flex flex-col justify-center items-center relative overflow-hidden select-none px-4">
      {/* Decorative background visual ambient effects */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-pink-500/10 filter blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 filter blur-3xl animate-pulse" />
      
      {/* Dynamic particles mockup context */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-10 left-[15%] w-1.5 h-1.5 rounded-full bg-pink-300 animate-ping" />
        <div className="absolute top-2/3 left-[8%] w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
        <div className="absolute top-1/3 right-[12%] w-1 h-1 rounded-full bg-indigo-300 animate-ping" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Core Loving Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-pink-500/30 rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.15)] mb-4 animate-bounce">
            <Heart className="h-7 w-7 text-pink-400 fill-pink-500/30" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight text-glow">
            相册回忆录
          </h2>
          <p className="text-zinc-400 text-xs mt-1.5 tracking-wide font-medium">
            专属恋人的秘密花园 · 留存永恒的纯真记忆
          </p>
        </div>

        {/* Unified Card Container */}
        <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          
          {/* Navigation Tab Menu */}
          <div className="flex border-b border-white/5 pb-4 mb-6">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 text-center py-2 text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5 transition-all outline-none ${
                activeTab === 'login'
                  ? 'text-pink-400 border-b-2 border-pink-500 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              密码登录
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 text-center py-2 text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5 transition-all outline-none ${
                activeTab === 'register'
                  ? 'text-pink-400 border-b-2 border-pink-500 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              号码注册
            </button>
            <button
              onClick={() => handleTabChange('admin')}
              className={`flex-1 text-center py-2 text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5 transition-all outline-none ${
                activeTab === 'admin'
                  ? 'text-pink-400 border-b-2 border-pink-500 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              管理员通道
            </button>
          </div>

          {/* Validation Feedback Banner */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-rose-300 text-xs animate-fade-in animate-pulse">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">操作未通过验证</p>
                <p className="text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold font-sans">处理成功</p>
                <p className="text-[11px] opacity-90 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Forms Segment */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab !== 'admin' ? (
              <>
                {/* Phone Number / Account Input */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5 font-bold">
                    手机号码 / 账户名
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="请输入手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5 font-bold">
                    账号密码
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="建议设置6位及以上密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Confirm Password (Register exclusive) */}
                {activeTab === 'register' && (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5 font-bold">
                      确认密码
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="请再次输入密码进行确认"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        required={activeTab === 'register'}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Admin Entrance exclusive input */
              <div className="animate-fade-in py-1">
                <div className="bg-zinc-900/50 border border-pink-500/10 p-3 rounded-xl mb-4 text-center">
                  <span className="text-[10px] text-zinc-400 font-mono tracking-wide leading-relaxed">
                    ⚙️ 管理系统拥有全局调试视图和账户一览，请提供特设密匙进行瞬时认证登录。
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5 font-bold">
                    管理员密钥 (Secret Key)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Key className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="管理专属密匙"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      disabled={isLoading}
                      required={activeTab === 'admin'}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-center font-mono letter-spacing-wide text-pink-400 placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/25 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Practical instructions on register content isolation */}
            {activeTab === 'register' && (
              <p className="text-[9px] text-zinc-500 font-serif leading-relaxed text-center mt-2.5">
                🔒 提示：注册后该手机号将建立完全隔离的专属云端数据库，数据与默认页完全隔离，其他人均不可见。
              </p>
            )}

            {/* Action Trigger Buttons */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>
                {isLoading
                  ? '请稍候...'
                  : activeTab === 'register'
                  ? '注册并开启浪漫相册'
                  : activeTab === 'admin'
                  ? '管理员授权进入'
                  : '进入浪漫回忆录'}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>

        {/* Elegant footer details */}
        <p className="text-center text-[9px] text-zinc-600 font-mono mt-8 uppercase tracking-widest leading-loose">
          Secure Sandbox Protection · Cloud State AutoSync Ready
        </p>
      </div>
    </div>
  );
}
