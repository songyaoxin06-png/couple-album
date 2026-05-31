import React, { useState, useEffect } from 'react';
import { PhotoCardType, CoupleConfig } from '../types';
import { X, MapPin, Calendar, Heart, MessageCircle, Sparkles, Loader2, RefreshCw, Edit3, Save, Trash2, Upload, FileImage } from 'lucide-react';
import { compressBase64 } from '../utils/imageCompressor';

interface CardDetailsModalProps {
  card: PhotoCardType;
  config: CoupleConfig;
  onClose: () => void;
  onUpdateCardComment: (cardId: string, text: string) => void;
  // Dynamic card replacement/updating callback
  onUpdateCard?: (updatedCard: PhotoCardType) => void;
  // Optional card deletion callback
  onDeleteCard?: (cardId: string) => void;
}

type ToneType = 'sweet' | 'deep' | 'poetic' | 'humorous';

export default function CardDetailsModal({
  card,
  config,
  onClose,
  onUpdateCardComment,
  onUpdateCard,
  onDeleteCard,
}: CardDetailsModalProps) {
  const [tone, setTone] = useState<ToneType>('sweet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentInputValue, setCommentInputValue] = useState(card.aiCommentary || '');

  // Editing state toggle to support card replaces!
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description);
  const [editUrl, setEditUrl] = useState(card.url);
  const [editLocation, setEditLocation] = useState(card.location || '');
  const [editDate, setEditDate] = useState(card.date);
  const [editTags, setEditTags] = useState(card.tags ? card.tags.join(', ') : '');

  // Safe status message states to replace iframe-unsafe alert()
  const [localStatusMsg, setLocalStatusMsg] = useState<string | null>(null);
  const [localStatusType, setLocalStatusType] = useState<'error' | 'success' | 'info'>('info');
  const [isCompressing, setIsCompressing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false);

  // Sync edits if the active inspected card changes
  useEffect(() => {
    setEditTitle(card.title);
    setEditDescription(card.description);
    setEditUrl(card.url);
    setEditLocation(card.location || '');
    setEditDate(card.date);
    setEditTags(card.tags ? card.tags.join(', ') : '');
    setIsEditing(false);
    setCommentInputValue(card.aiCommentary || '');
    setIsFullscreenZoom(false);
  }, [card]);

  // Key listener to close fullscreen image mode on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreenZoom) {
          setIsFullscreenZoom(false);
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isFullscreenZoom]);

  // Handle local image file upload & replacement
  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 14 * 1024 * 1024) {
        setLocalStatusType('error');
        setLocalStatusMsg('照片体积过大，请选择 14MB 以下图片~');
        return;
      }
      
      setIsCompressing(true);
      setLocalStatusType('info');
      setLocalStatusMsg('✨ 正在为您极速压缩并优化照片，请稍等...');

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const rawBase64 = event.target.result as string;
            // Compress down to 750px to fit perfectly inside polaroids and storage!
            const compressed = await compressBase64(rawBase64, 750, 750, 0.72);
            setEditUrl(compressed);
            setLocalStatusType('success');
            setLocalStatusMsg('🎉 上传并压制成功！回忆已就绪~');
          } catch (err) {
            console.error(err);
            setLocalStatusType('error');
            setLocalStatusMsg('照片压制失败，请重试');
          } finally {
            setIsCompressing(false);
          }
        } else {
          setIsCompressing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save details back to the App database
  const saveChanges = () => {
    if (!editTitle.trim()) {
      setLocalStatusType('error');
      setLocalStatusMsg('请给回忆片段起一个标题呀~');
      return;
    }
    if (!editUrl.trim()) {
      setLocalStatusType('error');
      setLocalStatusMsg('请上传或者提供图片的完整链接哦~');
      return;
    }

    const updatedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedCard: PhotoCardType = {
      ...card,
      title: editTitle,
      description: editDescription,
      url: editUrl,
      location: editLocation,
      date: editDate,
      tags: updatedTags,
    };

    if (onUpdateCard) {
      onUpdateCard(updatedCard);
    }

    setLocalStatusType('success');
    setLocalStatusMsg('💖 替换并保存成功，正在同步云端相册中...');

    // Close editing panel sequentially with visual rhythm 
    setTimeout(() => {
      setIsEditing(false);
      setLocalStatusMsg(null);
    }, 1200);
  };

  // Handle calling Gemini 3.5 API
  const generateAiConfession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: card.title,
          description: card.description,
          location: card.location,
          date: card.date,
          tone,
          partnerA: config.partnerA,
          partnerB: config.partnerB,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onUpdateCardComment(card.id, data.text);
        setCommentInputValue(data.text);
      } else {
        setError(data.error || '获取失败，请重试');
      }
    } catch (err: any) {
      console.error(err);
      setError('连接服务器超时，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
      {/* Background click to dismiss when NOT actively editing */}
      <div className="absolute inset-0" onClick={() => !isEditing && onClose()} />

      {/* Main glass card modal container */}
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-pink-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 max-h-[92vh] md:max-h-[85vh]">
        
        {/* Dismiss and edit button menu overlay */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full bg-zinc-950/60 border border-zinc-800 text-zinc-300 hover:text-pink-400 hover:border-pink-500/40 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-xs px-3 font-semibold font-sans"
              title="替换/编辑本条回忆"
            >
              <Edit3 className="h-4 w-4" />
              <span>编辑 / 替换图片</span>
            </button>
          ) : (
            <button
              onClick={saveChanges}
              className="p-2 rounded-full bg-pink-700 hover:bg-pink-600 border border-pink-500 text-white active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-xs px-3.5 font-bold font-sans"
              title="保存修改"
            >
              <Save className="h-4 w-4" />
              <span>保存</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-pink-400 hover:border-pink-500/20 active:scale-95 transition-all cursor-pointer"
            title="关闭窗口"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Left pane: Polaroid display or Editing Image replacement panel */}
        <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-zinc-950 border-r border-zinc-800/50 overflow-y-auto">
          {!isEditing ? (
            <div className="bg-zinc-950 border border-white/10 p-2.5 pb-6 rounded-xl shadow-2xl max-w-[260px] w-full transform -rotate-1 hover:rotate-0 transition-transform duration-300 relative">
              {/* Real photo display */}
              <div 
                className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-900 shadow-inner cursor-zoom-in group/photo"
                onClick={() => setIsFullscreenZoom(true)}
                title="点击全屏放大"
              >
                <img
                  src={card.url}
                  alt={card.title}
                  className="object-cover w-full h-full transform group-hover/photo:scale-[1.03] transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual hover hint overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/25 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-zinc-950/80 border border-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-pink-400" />
                    <span>点击全屏放大</span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 bg-zinc-950/70 border border-white/10 px-2 py-0.5 rounded text-[8px] tracking-wider text-pink-300 uppercase font-mono select-none">
                  {card.id}
                </div>
              </div>

              {/* Polaroid caption */}
              <div className="mt-3 text-center">
                <h4 className="font-sans font-bold text-white text-sm flex items-center justify-center gap-1.5 truncate">
                  <Heart className="h-3.5 w-3.5 fill-pink-400 text-pink-400 shrink-0" />
                  {card.title}
                </h4>
                <p className="font-mono text-[9px] text-zinc-400 tracking-wider uppercase mt-1 truncate">
                  {card.date} · {card.location || 'SWEET PLACE'}
                </p>
              </div>
            </div>
          ) : (
            // LIVE PICTURE REPLACER PANEL
            <div className="w-full max-w-sm flex flex-col gap-4">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-pink-400 font-bold block mb-1">
                PHOTO SOURCE REPLACER · 替换相册照片
              </span>

              {/* Preview image */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-dashed border-zinc-800 flex items-center justify-center shadow-inner group">
                {editUrl ? (
                  <>
                    <img
                      src={editUrl}
                      alt="Replacement preview"
                      className="object-cover w-full h-full opacity-70 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <FileImage className="h-8 w-8 text-white" />
                      <span className="text-xs text-white font-bold">已加载新照片</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 text-zinc-500 flex flex-col items-center gap-2">
                    <FileImage className="h-10 w-10 text-zinc-600 animate-pulse" />
                    <span className="text-xs">暂无图片来源</span>
                  </div>
                )}
              </div>

              {/* Upload dynamic file */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-medium block">
                  上传本地照片文件
                </label>
                <div className="relative flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 hover:border-pink-500/40 transition-all">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      <Upload className="w-6 h-6 text-pink-500 mb-1" />
                      <p className="text-xs text-zinc-300 font-semibold text-center px-4">
                        点击这里，上传并替换为你的本地照片
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">支持 PNG, JPG, GIF 等</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Text URL paste option source fallback */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-medium block">
                  或者使用网络图片链接 (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/your-image.jpg"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-pink-500/50 transition-all font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right pane: Details View / Form Input Fields */}
        <div className="md:w-1/2 p-6 flex flex-col gap-5 overflow-y-auto">
          {!isEditing ? (
            // VIEW MODE PANEL
            <>
              {/* Header */}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-pink-400 font-bold flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> MEMORY ARCHIVES
                </span>
                <h2 className="text-zinc-100 text-xl font-bold font-sans tracking-tight mt-1">
                  {card.title}
                </h2>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-zinc-800/80 border border-zinc-700/50 px-3 py-1 rounded-full text-xs text-zinc-300 font-sans flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-pink-400" /> {card.date}
                </span>
                {card.location && (
                  <span className="bg-zinc-800/80 border border-zinc-700/50 px-3 py-1 rounded-full text-xs text-zinc-300 font-sans flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-pink-400" /> {card.location}
                  </span>
                )}
                {card.tags?.map((t) => (
                  <span
                    key={t}
                    className="bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full text-xs text-pink-400 font-medium font-sans"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Description box */}
              <div className="bg-zinc-950/60 border border-zinc-800/40 p-4 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-semibold">
                  回忆记录
                </span>
                <p className="text-zinc-300 text-xs font-sans leading-relaxed whitespace-pre-wrap">
                  {card.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-zinc-800 via-pink-950/40 to-zinc-800" />

              {/* Gemini Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-widest text-pink-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-pulse" /> 我想对你说
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                    Flash Engine Active
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="love-whisper-textarea"
                    value={commentInputValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCommentInputValue(val);
                      onUpdateCardComment(card.id, val);
                    }}
                    placeholder="在这里亲笔写下你想对TA说的话，或者点击下方“唤醒 AI 浪漫心语”来谱写新情话..."
                    className="w-full h-36 bg-pink-950/5 border border-pink-500/10 focus:border-pink-500/30 focus:shadow-[0_0_12px_rgba(244,63,94,0.08)] focus:outline-none p-4 rounded-2xl text-pink-100 text-xs leading-relaxed font-sans font-medium resize-none transition-all placeholder:text-zinc-650"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-zinc-950/80 rounded-2xl flex flex-col gap-1.5 items-center justify-center">
                      <Loader2 className="h-6 w-6 text-pink-500 animate-spin" />
                      <span className="text-[11px] text-pink-300 tracking-wider font-sans">
                        正在谱写浪漫心语...
                      </span>
                    </div>
                  )}
                  {error && (
                    <p className="absolute bottom-2 left-4 text-rose-400 text-[10px] font-sans">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={generateAiConfession}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.01] transition-all cursor-pointer shadow-lg active:scale-95 disabled:scale-100 disabled:opacity-50"
                >
                  {card.aiCommentary ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin-slow" /> 换一束情话！
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> 唤醒 AI 浪漫心语
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            // EDIT/REPLACE DETAILS FORM PANEL
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-pink-400 font-bold block">
                  EDIT DETAILS FORM
                </span>
                <h3 className="text-zinc-100 text-base font-bold font-sans mt-0.5">
                  编辑当前卡片属性
                </h3>
              </div>

              {/* Status Banner Message Area */}
              {localStatusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed font-sans flex items-center gap-2 ${
                    localStatusType === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : localStatusType === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  }`}
                >
                  {(isLoading || isCompressing) && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-pink-500" />
                  )}
                  <span>{localStatusMsg}</span>
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium font-sans">
                  回忆标题 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：初遇那个午后"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-pink-500/50 transition-all font-sans"
                />
              </div>

              {/* Date & Location Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium font-sans">
                    发生日期
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-pink-500/50 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium font-sans">
                    足迹/地点
                  </label>
                  <input
                    type="text"
                    placeholder="例如：黄金湾沙滩"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-pink-500/50 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Description field */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium font-sans">
                  回忆细节记录
                </label>
                <textarea
                  placeholder="写下你们当时的温柔细节..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-pink-500/50 transition-all font-sans leading-relaxed resize-none"
                />
              </div>

              {/* Tags delimitered */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium font-sans flex justify-between">
                  <span>美好标签</span>
                  <span className="text-[9px] text-zinc-500 font-mono">用英文逗号分隔</span>
                </label>
                <input
                  type="text"
                  placeholder="心动, 拥抱, 纪念日"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:border-pink-500/50 transition-all font-sans"
                />
              </div>

              {/* Form buttons block */}
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 text-xs font-bold hover:text-zinc-200 hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
                >
                  取消编辑
                </button>
                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={isCompressing}
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black shadow-lg shadow-pink-600/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-55"
                >
                  {isCompressing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  保存并替换
                </button>
              </div>

              {/* Delete capability with modern safe UI confirm dialog */}
              {onDeleteCard && !showDeleteConfirm && (
                <div className="pt-2 border-t border-zinc-800/50 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2 rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 text-xs font-bold flex items-center justify-center gap-1.5 border border-transparent hover:border-rose-500/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除此回忆卡片
                  </button>
                </div>
              )}

              {/* Inline delete confirmation box */}
              {showDeleteConfirm && (
                <div className="p-3.5 bg-rose-950/15 border border-rose-500/25 rounded-2xl flex flex-col gap-2 animate-fade-in mt-1">
                  <p className="text-[11px] text-rose-300 font-sans text-center font-semibold">
                    ⚠️ 亲爱的，确定要永久删除这条珍贵的回忆卡片吗？此操作无法撤销。
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-zinc-400 text-[11px] font-bold"
                    >
                      陪着我（取消）
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onDeleteCard) onDeleteCard(card.id);
                        onClose();
                      }}
                      className="flex-1 py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Screen-wide immersive photo lightbox overlay for double-magnification */}
      {isFullscreenZoom && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-fade-in select-none"
          onClick={() => setIsFullscreenZoom(false)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={card.url}
              alt={card.title}
              className="max-w-[100vw] max-h-[92vh] md:max-w-[94vw] md:max-h-[90vh] object-contain rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/5 cursor-zoom-out"
              onClick={() => setIsFullscreenZoom(false)}
              referrerPolicy="no-referrer"
            />
            
            {/* Elegant bottom caption banner explaining the memory and instructions to exit */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-950/80 border border-white/15 backdrop-blur-md px-4 py-2 rounded-full text-center max-w-[90%] pointer-events-none shadow-xl flex items-center justify-center gap-1.5 whitespace-nowrap">
              <Heart className="h-3 w-3 text-pink-400 fill-pink-400 shrink-0" />
              <p className="text-white font-sans text-[11px] font-extrabold tracking-tight">
                {card.title}
              </p>
              <span className="text-zinc-400 font-mono text-[9px] border-l border-zinc-800 pl-1.5 ml-1.5 select-none">
                点击任意位置或按 ESC 退出放映
              </span>
            </div>

            {/* Extreme corner close button for precise control */}
            <button
              onClick={() => setIsFullscreenZoom(false)}
              className="absolute -top-3 -right-3 md:top-4 md:right-4 p-2.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 hover:text-pink-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg z-10"
              title="关闭全屏"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
