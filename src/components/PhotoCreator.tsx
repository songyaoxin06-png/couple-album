import React, { useState, useRef, useEffect } from 'react';
import { PhotoCardType } from '../types';
import { Camera, Image, UploadCloud, X, PlusCircle, Check, HelpCircle, Loader2 } from 'lucide-react';

interface PhotoCreatorProps {
  onAddCard: (card: PhotoCardType) => void;
}

// 6 beautiful default preset memories the user can click to quickly load
const PRESET_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
    title: '海滩漫步',
    description: '暖风吻过海岸，你拉着我的手，好像这一条路长得看不到尽头。这就是理想世界的模样吧。',
    location: '海之角',
    tags: ['甜蜜', '旅行']
  },
  {
    url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop',
    title: '咖啡馆午后',
    description: '窗外在落雨，你点了黑森林蛋糕，我看着你吃饱时的眯眼笑脸，觉得时间变慢了。',
    location: 'Sweet Cafe',
    tags: ['治愈', '日常']
  },
  {
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop',
    title: '露营星宿下',
    description: '山谷夜风微凉，篝火噼啪作响。抬头是璀璨的银河星盘，转头是比璀璨星辉更耀眼的你。',
    location: '山海星营',
    tags: ['星空', '探险']
  },
  {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    title: '林深见鹿散步',
    description: '在被金色阳光穿透的秋季枫林深处，我们踩在松软的碎壳上。你突然回头说：喂，你要抱一抱我嘛。',
    location: '原始红叶林',
    tags: ['深秋', '浪漫']
  }
];

export default function PhotoCreator({ onAddCard }: PhotoCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Camera integration state variables
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop camera helper
  const stopCameraStreams = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup streams on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle camera capture start
  const handleStartCamera = async () => {
    setCameraError(null);
    setUseCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError('无法调用摄像头：请确认浏览器授权，或改为直接电脑上传、选择预置图案。');
      setUseCamera(false);
    }
  };

  // Click capture canvas snap
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraStream) return;

    try {
      const canvas = document.createElement('canvas');
      const side = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Square center crop logic
        const sx = (video.videoWidth - side) / 2;
        const sy = (video.videoHeight - side) / 2;
        ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImageUrl(dataUrl);
      }
      stopCameraStreams();
    } catch (e) {
      console.error("Capture snap failed", e);
    }
  };

  // Base64 Local Image File Upload File Reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Click Submit Form Card Callback
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    const parsedTags = tagsInput
      .split(/[,，#\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newCard: PhotoCardType = {
      id: `custom_${Date.now()}`,
      url: imageUrl,
      title: title || '新甜蜜片段',
      description: description || '往后余生，一起去创造更多难忘的美好回忆。',
      location: location || undefined,
      date: date || new Date().toISOString().substring(0, 10),
      tags: parsedTags.length > 0 ? parsedTags : ['美好'],
    };

    onAddCard(newCard);

    // Reset fields
    setTitle('');
    setDescription('');
    setLocation('');
    setDate(new Date().toISOString().substring(0, 10));
    setTagsInput('');
    setImageUrl('');
    setIsOpen(false);
    stopCameraStreams();
  };

  return (
    <>
      {/* Absolute bottom left overlay buttons */}
      <div className="fixed bottom-4 left-4 md:left-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 border border-pink-400/20 text-white font-bold text-xs uppercase tracking-wide rounded-full shadow-lg hover:from-pink-500 hover:to-rose-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          id="add-memory-btn"
        >
          <PlusCircle className="h-4 w-4" />
          <span>添加回忆</span>
        </button>
      </div>

      {/* Primary Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          {/* Background click dismiss */}
          <div className="absolute inset-0" onClick={() => { setIsOpen(false); stopCameraStreams(); }} />

          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[90vh]">
            {/* Modal header details */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-5 shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-pink-500" />
                <h3 className="text-zinc-100 font-bold text-md font-sans tracking-tight">记录新的甜蜜回忆</h3>
              </div>
              <button
                onClick={() => { setIsOpen(false); stopCameraStreams(); }}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Form Scroll area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              
              {/* Image Input Selection Source Area */}
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  相册图片源 (选择以下一种方式)
                </span>

                {imageUrl ? (
                  /* Picture Selected preview state */
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-pink-500/30">
                    <img src={imageUrl} alt="preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-3 right-3 p-1.5 bg-zinc-950/80 hover:bg-zinc-900 text-rose-400 rounded-full border border-zinc-800 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-emerald-500/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                      <Check className="h-3 w-3" /> 图片已选定
                    </div>
                  </div>
                ) : useCamera ? (
                  /* Camera Active Stream video element */
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-pink-500/30 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]" // mirror view
                    />
                    
                    {/* Shoot snapshot controller panel */}
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                      <button
                        type="button"
                        onClick={stopCameraStreams}
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold hover:text-zinc-200 transition-all shadow-md"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                        📷 快门拍摄
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial upload action matrix buttons */
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Active Webcam interface trigger */}
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="h-28 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-pink-500/30 p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-900/50 transition-all cursor-pointer group"
                      >
                        <Camera className="h-6 w-6 text-pink-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-zinc-200 font-bold">自拍拍照</span>
                        <span className="text-[9px] text-zinc-500 leading-none">调用系统摄像头</span>
                      </button>

                      {/* File select drag overlay action */}
                      <label className="h-28 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-pink-500/30 p-4 flex flex-col items-center justify-center gap-2 hover:bg-zinc-900/50 transition-all cursor-pointer group select-none">
                        <UploadCloud className="h-6 w-6 text-pink-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-zinc-200 font-bold">本地上传</span>
                        <span className="text-[9px] text-zinc-500 leading-none">本地相册、文件夹</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {cameraError && (
                      <p className="text-rose-400 text-[10px] font-sans pr-1 leading-normal">
                        {cameraError}
                      </p>
                    )}

                    {/* Pre-seeded presets gallery line option */}
                    <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase block mb-2">
                        💡 快速加载浪漫示例预置
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PRESET_IMAGES.map((p, idx) => (
                          <button
                            key={p.title}
                            type="button"
                            onClick={() => {
                              setImageUrl(p.url);
                              setTitle(p.title);
                              setDescription(p.description);
                              setLocation(p.location);
                              setTagsInput(p.tags.join(', '));
                            }}
                            className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 hover:border-pink-500/40 hover:scale-105 transition-all group cursor-pointer"
                            title={p.title}
                          >
                            <img src={p.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center text-[10px] font-semibold text-white">
                              {idx + 1}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title input field */}
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  片段主题
                </label>
                <input
                  type="text"
                  required
                  maxLength={18}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如: 手作烘焙日 / 屋檐听落雨"
                  className="bg-zinc-950 border border-zinc-800 focus:border-pink-500/40 outline-none text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl transition-all"
                />
              </div>

              {/* Grid location & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    发生时间
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-pink-500/40 outline-none text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl transition-all select-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    甜蜜地点
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如: 古镇客栈 / 海之角"
                    className="bg-zinc-950 border border-zinc-800 focus:border-pink-500/40 outline-none text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Description memory history */}
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  回忆纪实 / 小故事
                </label>
                <textarea
                  rows={2}
                  maxLength={150}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="用短短一两句话，记下那一瞬间的感动和欢闹..."
                  className="bg-zinc-950 border border-zinc-800 focus:border-pink-500/40 outline-none text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Tag inputs */}
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>标签分类</span>
                  <span className="text-[10px] text-zinc-500 font-mono">逗号、空格或井号分隔</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="如: 纪念日 厨艺 第一次度假"
                  className="bg-zinc-950 border border-zinc-800 focus:border-pink-500/40 outline-none text-zinc-200 text-xs px-3.5 py-2.5 rounded-xl transition-all"
                />
              </div>

              {/* Absolute footer submit key */}
              <div className="border-t border-zinc-800 pt-4 mt-2 select-none shrink-0">
                <button
                  type="submit"
                  disabled={!imageUrl}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] shadow-lg active:scale-95 cursor-pointer disabled:scale-100 disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  保存回忆卡片
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
