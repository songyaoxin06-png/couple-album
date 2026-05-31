import React, { useState } from 'react';
import { Settings, Heart, Calendar, FileText, Palette, ChevronRight, Sparkles } from 'lucide-react';
import { CoupleConfig } from '../types';

interface ConfigPanelProps {
  config: CoupleConfig;
  onChange: (newConfig: CoupleConfig) => void;
}

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const calculateDays = (dateStr: string) => {
    try {
      const anniversary = new Date(dateStr);
      const today = new Date();
      // Reset hours to calculate exact days diff
      anniversary.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - anniversary.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const daysCount = calculateDays(config.anniversaryDate);

  return (
    <>
      {/* Days count badge - positioned in the very top-center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/85 backdrop-blur-md border border-pink-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.1)] select-none">
        <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500 animate-pulse" />
        <span className="text-zinc-200 text-xs font-semibold font-sans">
          相爱已
        </span>
        <span className="text-pink-400 text-sm font-extrabold font-mono">
          {daysCount >= 0 ? daysCount : 0}
        </span>
        <span className="text-zinc-200 text-xs font-semibold font-sans">
          天
        </span>
      </div>

      {/* Settings toggle button moved down a bit to top-20 */}
      <div className="fixed top-20 right-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-pink-500/20 text-pink-400 hover:text-pink-300 hover:border-pink-500/40 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center justify-center animate-fade-in"
          id="config-toggle-btn"
          title="个性化设置"
        >
          <Settings className={`h-5 w-5 ${isOpen ? 'rotate-90' : ''} transition-transform duration-300`} />
        </button>
      </div>

      {/* Floating sliding drawer panel overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-40 pointer-events-none"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        id="side-config-drawer"
        className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] z-50 bg-zinc-950/95 backdrop-blur-xl border-l border-pink-500/10 p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-pink-950/50 pb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500 fill-pink-500/30" />
            <span className="text-zinc-100 text-md font-bold tracking-tight">专属相册个性化</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Input variables form */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
          {/* Lover Name Settings */}
          <div className="flex flex-col gap-2">
            <label className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-pink-400" /> 恋人尊称 (缩写或爱称)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-pink-400/70 font-mono">她 / 他</span>
                <input
                  type="text"
                  maxLength={10}
                  value={config.partnerA}
                  onChange={(e) => onChange({ ...config, partnerA: e.target.value })}
                  placeholder="如: W"
                  className="bg-zinc-900 border border-zinc-800 focus:border-pink-500/50 outline-none text-zinc-100 text-sm px-3 py-2 rounded-xl transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-pink-400/70 font-mono">你</span>
                <input
                  type="text"
                  maxLength={10}
                  value={config.partnerB}
                  onChange={(e) => onChange({ ...config, partnerB: e.target.value })}
                  placeholder="如: Y"
                  className="bg-zinc-900 border border-zinc-800 focus:border-pink-500/50 outline-none text-zinc-100 text-sm px-3 py-2 rounded-xl transition-all"
                />
              </div>
            </div>
          </div>

          {/* Anniversary Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5 text-pink-400" /> 相识/恋爱纪念日
            </label>
            <input
              type="date"
              value={config.anniversaryDate}
              onChange={(e) => onChange({ ...config, anniversaryDate: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 focus:border-pink-500/50 outline-none text-zinc-100 text-sm px-3 py-2 rounded-xl w-full select-none"
            />
          </div>

          {/* Album display title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-pink-400" /> 相册主标题
            </label>
            <input
              type="text"
              maxLength={20}
              value={config.albumTitle}
              onChange={(e) => onChange({ ...config, albumTitle: e.target.value })}
              placeholder="自定义浪漫标题"
              className="bg-zinc-900 border border-zinc-800 focus:border-pink-500/50 outline-none text-zinc-100 text-sm px-3 py-2 rounded-xl w-full"
            />
          </div>

          {/* Particle skin vibe selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="h-3.5 w-3.5 text-pink-400" /> 主题氛围肤色
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'dreamy', label: '🌸 梦幻粉樱' },
                { id: 'ocean', label: '🫧 蔚蓝深海' },
                { id: 'galaxy', label: '🌌 极光星云' },
                { id: 'forest', label: '🍀 精灵深林' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => onChange({ ...config, bgVibe: v.id as any })}
                  className={`px-3 py-2 text-xs font-medium rounded-xl text-center border transition-all cursor-pointer ${
                    config.bgVibe === v.id
                      ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Brand foot labels */}
        <div className="border-t border-pink-950/40 pt-4 text-center">
          <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
            Designed with Gemini 3.5 AI
          </p>
          <p className="text-[9px] text-zinc-600 font-mono mt-1">
            Build with deep love & romantic vibes
          </p>
        </div>
      </div>
    </>
  );
}
