import React, { useEffect, useRef, useState } from 'react';
import { AmbientSynth } from '../utils/audioSynth';
import { Play, Pause, Volume2, Music, Sparkles, Upload, FileAudio, Disc, Minimize2, Maximize2, X, Trash2, Eye, EyeOff } from 'lucide-react';
import { LyricLine } from '../types';

// IndexedDB Helper functions for robust client-side custom background audio file persistence
const DB_NAME = 'RomanticMemoryAudioDB';
const STORE_NAME = 'audio_files';

function saveAudioToDB(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ blob: file, name: file.name }, 'custom_audio');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function getAudioFromDB(): Promise<{ blob: Blob; name: string } | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        resolve(null);
        return;
      }
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get('custom_audio');
      getReq.onsuccess = () => {
        db.close();
        resolve(getReq.result || null);
      };
      getReq.onerror = () => {
        db.close();
        reject(getReq.error);
      };
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function deleteAudioFromDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('custom_audio');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

interface AudioPlayerProps {
  partnerA: string;
  partnerB: string;
}

// Romantic scrolling love poetry
const DEFAULT_LYRICS: LyricLine[] = [
  { time: 0, text: "✨ 直到你降临 像一颗流星 划破我长夜的寂静 ✨" },
  { time: 4, text: "是你带着光 照亮我的眼睛 融化了我所有的冷清" },
  { time: 8, text: "想要和你去 世界的每个角落 收集最甜的温柔" },
  { time: 12, text: "因为遇见你 我才真正明白 什么是命中注定" },
  { time: 16, text: "在闪耀的爱心星空中 唯独你的笑容最让我心动" },
  { time: 20, text: "每一个心跳 都是属于我们俩的专属浪漫频率" },
  { time: 24, text: "手紧紧牵着 往后的余生里 不论风雨都一起并肩" },
  { time: 28, text: "你就是我的星河浩瀚 我追寻的唯一宿命归宿" },
  { time: 32, text: "愿在温润的时光里 执手共度每一个日出与黄昏" }
];

interface SongOption {
  id: string;
  name: string;
  url: string;
  desc: string;
}

const DEFAULT_SONGS: SongOption[] = [
  {
    id: 'song1',
    name: '《直到你降临 · 浪漫钢琴》',
    url: 'https://pub-c5e31b5cdafb419a866171115c9006ae.r2.dev/love-story-piano.mp3', // high speed CDN romantic track
    desc: '温暖悠扬的浪漫纯钢琴变奏曲'
  },
  {
    id: 'song2',
    name: '《流星许愿 · 温柔吉他》',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    desc: '温柔清澈的治愈吉他指弹'
  },
  {
    id: 'song3',
    name: '《微风吹拂 · 甜蜜节奏》',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    desc: '甜蜜轻快的慵懒行进律动'
  },
  {
    id: 'song4',
    name: '《执手百年 · 悠扬小提琴》',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    desc: '深情舒缓的弦乐与合成声部'
  }
];

export default function AudioPlayer({ partnerA, partnerB }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.7); // Start at a lush, audible 70% volume by default
  const [activeLyric, setActiveLyric] = useState(DEFAULT_LYRICS[0].text);
  const [musicMode] = useState<'mp3' | 'synth'>('mp3');
  const [selectedSongIdx, setSelectedSongIdx] = useState(0);
  
  // Custom audio sources state matching user-uploaded songs
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [isNameHidden, setIsNameHidden] = useState(false);

  // New audio states: playback progress, duration and volume slider visibility
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Close & small-window minimized state controls
  const [isClosed, setIsClosed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // Dragging positional coordinates states for a freely floating custom widget
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartClient = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('a') ||
      target.closest('label')
    ) {
      return;
    }
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    dragStartClient.current = {
      x: e.clientX,
      y: e.clientY
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement | HTMLButtonElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const lyricTimer = useRef<NodeJS.Timeout | null>(null);
  const lyricIndex = useRef(0);

  // Sound generator objects refs
  const synthRef = useRef<AmbientSynth | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize synth components safely on mount
  useEffect(() => {
    synthRef.current = new AmbientSynth();

    // Retrieve custom audio file from IndexedDB if exists
    getAudioFromDB().then((data) => {
      if (data) {
        const fileUrl = URL.createObjectURL(data.blob);
        setCustomAudioUrl(fileUrl);
        setCustomFileName(data.name);
      }
    }).catch(err => {
      console.error("Failed to load persisted custom audio:", err);
    });

    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (lyricTimer.current) {
        clearInterval(lyricTimer.current);
      }
    };
  }, []);

  // Sync scroll subtitles
  const startLyrics = () => {
    if (lyricTimer.current) clearInterval(lyricTimer.current);
    lyricIndex.current = 0;
    setActiveLyric(DEFAULT_LYRICS[0].text);

    lyricTimer.current = setInterval(() => {
      lyricIndex.current = (lyricIndex.current + 1) % DEFAULT_LYRICS.length;
      setActiveLyric(DEFAULT_LYRICS[lyricIndex.current].text);
    }, 4500);
  };

  const stopLyrics = () => {
    if (lyricTimer.current) {
      clearInterval(lyricTimer.current);
      lyricTimer.current = null;
    }
  };

  // Main Toggle playback triggering
  const togglePlayback = () => {
    if (isPlaying) {
      // Pause all instances
      if (musicMode === 'synth' && synthRef.current) {
        synthRef.current.stop();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      stopLyrics();
      setIsPlaying(false);
    } else {
      // Play selection
      triggerPlayAction();
    }
  };

  const triggerPlayAction = () => {
    if (musicMode === 'synth') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (synthRef.current) {
        synthRef.current.start();
        synthRef.current.setVolume(currentVolume);
      }
    } else {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.volume = currentVolume;
        // Reset and load of the newly configured audio element source link
        audioRef.current.load();
        audioRef.current.play().catch(err => {
          console.warn("Autoplay / Programmatic playback deferred waiting for interaction: ", err);
        });
      }
    }
    startLyrics();
    setIsPlaying(true);
    startVisualizer();
  };

  // Monitor music mode toggle, track index, or local upload changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) {
      // Restart cleanly into the new audio environment mode
      triggerPlayAction();
    }
  }, [musicMode, selectedSongIdx, customAudioUrl]);

  // Adjust volume scales
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setCurrentVolume(vol);
    if (musicMode === 'synth' && synthRef.current) {
      synthRef.current.setVolume(vol);
    } else if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Adjust local files select uploads and persist to DB
  const handleLocalAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      saveAudioToDB(file).then(() => {
        const fileUrl = URL.createObjectURL(file);
        setCustomAudioUrl(fileUrl);
        setCustomFileName(file.name);

        // If already playing, immediately stream the newly loaded track
        if (isPlaying) {
          setTimeout(() => {
            triggerPlayAction();
          }, 80);
        }
      }).catch(err => {
        console.error("Failed to save custom audio to DB:", err);
      });
    }
  };

  // Delete the custom audio from local IndexedDB and reset states
  const handleDeleteCustomAudio = () => {
    deleteAudioFromDB().then(() => {
      setCustomAudioUrl(null);
      setCustomFileName(null);
      // Force fallback clear
      setSelectedSongIdx(0);
    }).catch(err => {
      console.error("Failed to delete custom audio from DB:", err);
    });
  };

  // Spectrum dynamic rendering
  const startVisualizer = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = synthRef.current?.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const drawSpec = () => {
      if (!canvas || !ctx) return;
      const W = canvas.width = 110;
      const H = canvas.height = 36;

      ctx.clearRect(0, 0, W, H);

      const numBars = 10;
      const barWidth = (W / numBars) - 2;
      let x = 0;

      if (musicMode === 'synth' && analyser) {
        // Render precise node frequencies
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < numBars; i++) {
          let barHeight = (dataArray[i * 2] / 255) * H * 0.95;
          if (barHeight < 2) barHeight = 2;

          const gradient = ctx.createLinearGradient(0, H, 0, H - barHeight);
          gradient.addColorStop(0, '#db2777');
          gradient.addColorStop(1, '#f472b6');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, H - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      } else {
        // Simulated beautiful dynamic sine wave bars since external streaming source MP3 CORS is blocked
        const time = Date.now() * 0.006;
        for (let i = 0; i < numBars; i++) {
          let sinVal = Math.sin(time + i * 0.7) * Math.cos(time * 0.3 + i * 0.2);
          let barHeight = isPlaying ? (0.2 + Math.abs(sinVal) * 0.8) * H * 0.85 : 2;
          if (barHeight < 2) barHeight = 2;

          const gradient = ctx.createLinearGradient(0, H, 0, H - barHeight);
          gradient.addColorStop(0, '#db2777');
          gradient.addColorStop(1, '#f472b6');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, H - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      }

      animationRef.current = requestAnimationFrame(drawSpec);
    };

    drawSpec();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* Hidden native html audio tag without CORS block */}
      <audio
        ref={audioRef}
        src={customAudioUrl || DEFAULT_SONGS[selectedSongIdx].url}
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
      />

      {isClosed ? (
        /* Floating Launcher Bubble when hidden completely */
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => {
            const dx = Math.abs(e.clientX - dragStartClient.current.x);
            const dy = Math.abs(e.clientY - dragStartClient.current.y);
            handlePointerUp();
            if (dx < 5 && dy < 5) {
              setIsClosed(false);
              setIsMinimized(false); // restore full player
            }
          }}
          onPointerCancel={handlePointerUp}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          className="fixed top-4 left-4 md:left-6 md:right-auto z-50 h-11 w-11 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center shadow-xl cursor-pointer hover:scale-105 active:scale-95 border border-pink-400/20 group select-none"
          title="按住拖拽，点击打开背景音乐"
        >
          <div className="relative">
            <Music className={`h-4.5 w-4.5 ${isPlaying ? 'animate-bounce' : ''}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 border border-zinc-950 animate-pulse" />
            )}
          </div>
          {/* Tooltip hint on hover */}
          <span className="absolute left-14 bg-zinc-900 border border-pink-500/15 text-zinc-100 text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
            🎵 拖拽或点击控制台
          </span>
        </button>
      ) : isMinimized ? (
        /* Minimized Small Window Floating Player */
        <div 
          id="audio-player-mini" 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          className="fixed top-4 left-4 right-4 md:left-6 md:right-auto md:w-80 z-40 bg-zinc-950/90 backdrop-blur-xl border border-pink-500/20 px-3.5 py-2.5 rounded-full flex items-center justify-between gap-3 shadow-2xl animate-fade-in select-none"
        >
          
          {/* Left: Little rotating cover & title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div 
              className={`relative h-8 w-8 rounded-full border border-pink-500/30 flex items-center justify-center bg-zinc-900 shrink-0 shadow-md ${isPlaying ? 'animate-spin' : ''}`} 
              style={{ animationDuration: '10s' }}
            >
              <div className="absolute inset-1 rounded-full bg-zinc-950 flex items-center justify-center border border-dashed border-pink-400/20">
                <Disc className={`h-3 w-3 text-pink-400 ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="text-zinc-100 text-[11px] font-bold truncate leading-none flex items-center gap-1.5 justify-between">
                <span className="truncate">
                  {isNameHidden ? "✨ 专属守护音轨 ✨" : (customFileName ? customFileName : DEFAULT_SONGS[selectedSongIdx].name)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNameHidden(!isNameHidden);
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-pink-400 hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer shrink-0"
                  title={isNameHidden ? "显示音乐名称" : "隐藏音乐名称"}
                >
                  {isNameHidden ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                </button>
              </h4>
              <p className="text-zinc-400 text-[9px] font-mono leading-none truncate mt-1">
                {isPlaying ? `✨ ${activeLyric}` : "已暂停背景音乐"}
              </p>
            </div>
          </div>

          {/* Right Controls Widget including Pause key */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Play or Pause - Explicit user mandate */}
            <button
              type="button"
              onClick={togglePlayback}
              className={`flex items-center justify-center h-7 w-7 rounded-full border transition-all active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-pink-600 border-pink-500 text-white hover:bg-pink-500'
                  : 'bg-zinc-900 border-zinc-800 text-pink-400 hover:border-pink-500/40 hover:bg-zinc-850'
              }`}
              title={isPlaying ? "暂停音乐" : "播放音乐"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
            </button>

            {/* Restore option */}
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex items-center justify-center h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all active:scale-95 cursor-pointer"
              title="展开完整控台"
            >
              <Maximize2 className="h-3 w-3" />
            </button>

            {/* Complete hide option */}
            <button
              type="button"
              onClick={() => setIsClosed(true)}
              className="flex items-center justify-center h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/10 transition-all active:scale-95 cursor-pointer"
              title="关闭音乐盒"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Controller Panel with top bar controls */
        <div 
          id="audio-player-container" 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          className="fixed top-4 left-4 right-4 md:left-6 md:right-auto md:w-96 z-40 bg-zinc-950/85 backdrop-blur-xl border border-pink-500/15 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl animate-fade-in select-none"
        >
          
          {/* Top Panel Actions with Minimize & Close */}
          <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold font-mono flex items-center gap-1 header-drag-handle">
              <Music className="h-2.5 w-2.5 inline text-pink-500" /> MUSIC PLAYER · 拖拽背景音乐
            </span>
            <div className="flex gap-1.5">
              {/* Small Window / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded text-zinc-500 hover:text-pink-400 hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                title="精简小窗播放"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsClosed(true)}
                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                title="关闭音乐控台"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Top track details */}
          <div className="flex items-center gap-3">
            {/* Disc Rotate cover inside player frame */}
            <div 
              className={`relative h-11 w-11 rounded-full border border-pink-500/30 flex items-center justify-center bg-zinc-900 group shrink-0 shadow-lg ${isPlaying ? 'animate-spin' : ''}`} 
              style={{ animationDuration: '10s' }}
            >
              <div className="absolute inset-1.5 rounded-full bg-zinc-950 flex items-center justify-center border border-dashed border-pink-400/20">
                <Disc className={`h-4 w-4 text-pink-400 ${isPlaying ? 'animate-pulse' : ''}`} />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-pink-400 animate-pulse" />
            </div>

            {/* Text descriptions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] uppercase tracking-widest text-pink-400 font-extrabold font-mono">
                  🎧 MP3 STREAMING
                </span>
                {isPlaying && (
                  <span className="flex gap-0.5 items-center">
                     <span className="h-1 text-emerald-400">● 正在播放</span>
                  </span>
                )}
                {/* Switch to enable/disable metadata display */}
                <button
                  type="button"
                  onClick={() => setIsNameHidden(!isNameHidden)}
                  className="p-1 py-0.5 rounded text-zinc-500 hover:text-pink-400 hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                  title={isNameHidden ? "显示音乐名称" : "隐藏音乐名称"}
                >
                  {isNameHidden ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                  <span className="text-[9px]">{isNameHidden ? '显示名字' : '隐藏名字'}</span>
                </button>
              </div>
              <h3 className="text-zinc-100 text-xs font-bold font-sans truncate mt-0.5" title={isNameHidden ? "✨ 专属守护音轨 ✨" : (customFileName || DEFAULT_SONGS[selectedSongIdx].name)}>
                {isNameHidden ? "✨ 专属守护音轨 ✨" : (customFileName ? `🎵 ${customFileName}` : DEFAULT_SONGS[selectedSongIdx].name)}
              </h3>
              <p className="text-zinc-400 text-[10px] font-mono mt-0.5 truncate">
                {isNameHidden ? "🔒 播放属性已隐藏" : `🎧 ${DEFAULT_SONGS[selectedSongIdx].desc}`}
              </p>
            </div>

            {/* Canvas spectrum */}
            <canvas ref={visualizerCanvasRef} className="w-14 h-6 shrink-0 opacity-80" />
          </div>

          {/* Local music file uploader widget with Delete custom audio support */}
          <div className="bg-zinc-900/60 p-2 border border-zinc-900 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
            <span className="text-[10px] text-zinc-400 font-sans font-medium flex items-center gap-1.5 ml-1">
              <Upload className="h-3.5 w-3.5 text-pink-400" /> 支持自定义本地 MP3 音轨
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {customAudioUrl && (
                <button
                  type="button"
                  onClick={handleDeleteCustomAudio}
                  className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-405 hover:bg-rose-900/50 hover:text-rose-300 hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-center"
                  title="删除该自定义音轨"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <label className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                customAudioUrl ? 'bg-pink-900/70 text-pink-200 border border-pink-500/30' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-sm'
              }`}>
                {customAudioUrl ? "📂 已加载自定义音轨" : "📤 上传本地音乐"}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleLocalAudioUpload}
                />
              </label>
            </div>
          </div>

          {/* Playlist Selector - Only shown when in MP3 mode */}
          <div className="flex flex-col gap-1 select-none">
            <label className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">
              🎬 浪漫伴奏歌单 / PLAYLIST
            </label>
            <select
              value={customAudioUrl ? 99 : selectedSongIdx}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val === 99) {
                  // do nothing if selecting custom while already uploaded
                } else {
                  setSelectedSongIdx(val);
                  setCustomAudioUrl(null);
                  setCustomFileName(null);
                }
              }}
              className="w-full bg-zinc-900 border border-pink-500/10 text-zinc-100 rounded-xl p-1.5 text-xs font-semibold focus:outline-none focus:border-pink-500/40 cursor-pointer"
            >
              {DEFAULT_SONGS.map((song, i) => (
                <option key={song.id} value={i} className="bg-zinc-950 text-zinc-100">
                  {song.name}
                </option>
              ))}
              {customAudioUrl && (
                <option value={99} className="bg-zinc-950 text-pink-400">
                  📂 [本地上传] {customFileName || "自定义音轨"}
                </option>
              )}
            </select>
          </div>

          {/* Synchronized Love Poetry Display Subtitle */}
          <div className="bg-pink-500/5 border border-pink-500/10 rounded-xl py-2 px-3 min-h-[42px] flex items-center justify-center text-center overflow-hidden transition-all">
            <p className="text-pink-300 text-[11px] font-semibold select-none leading-relaxed tracking-wide animate-fade-in">
              {isPlaying ? activeLyric : "点击播放，开启专属背景音乐与流星诗篇"}
            </p>
          </div>

          {/* Play, music playback seeking progress and vertical volume popover */}
          <div className="flex items-center gap-3 justify-between pt-0.5">
            <button
              type="button"
              onClick={togglePlayback}
              className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all duration-300 shadow-md shrink-0 ${
                isPlaying
                  ? 'bg-pink-600 text-white border-pink-500 hover:bg-pink-500 hover:scale-105'
                  : 'bg-zinc-900 text-pink-400 border-pink-500/20 hover:border-pink-400 hover:scale-105 hover:bg-zinc-800'
              }`}
              title={isPlaying ? "暂停音乐" : "播放背景音乐"}
              id="music-play-btn"
            >
              {isPlaying ? <Pause className="h-[15px] w-[15px]" /> : <Play className="h-[15px] w-[15px] ml-0.5" />}
            </button>

            {/* Original volume slider spot is now replaced with playback seek progress */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono text-zinc-400 shrink-0 select-none">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (audioRef.current) {
                    audioRef.current.currentTime = val;
                  }
                }}
                className="flex-1 h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-pink-500"
                title="播放进度控制"
              />
              <span className="text-[10px] font-mono text-zinc-400 min-w-[28px] text-right shrink-0 select-none">
                {formatTime(duration)}
              </span>
            </div>

            {/* Vertical volume control popped over volume icon */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                type="button"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-pink-400 transition-all cursor-pointer"
                title="音量调节"
              >
                <Volume2 className="h-4.5 w-4.5" />
              </button>
              
              {showVolumeSlider && (
                <div className="absolute bottom-full right-0 mb-2 bg-zinc-950/95 border border-pink-500/20 p-2.5 rounded-xl shadow-2xl flex flex-col items-center gap-1.5 animate-fade-in z-50 w-8">
                  <span className="text-[9px] font-mono font-bold text-pink-400">
                    {Math.round(currentVolume * 100)}
                  </span>
                  <div className="h-16 w-3 relative flex items-center justify-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentVolume}
                      onChange={handleVolumeChange}
                      className="h-14 cursor-pointer accent-pink-500"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        WebkitAppearance: 'slider-vertical',
                      }}
                      title="音量控制"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
