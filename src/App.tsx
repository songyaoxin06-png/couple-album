import React, { useState, useRef, useEffect } from 'react';
import { LayoutMode, PhotoCardType, CoupleConfig } from './types';
import BackgroundParticles from './components/BackgroundParticles';
import AudioPlayer from './components/AudioPlayer';
import ConfigPanel from './components/ConfigPanel';
import PhotoCard from './components/PhotoCard';
import PhotoCreator from './components/PhotoCreator';
import CardDetailsModal from './components/CardDetailsModal';
import IntroFlyThrough from './components/IntroFlyThrough';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import { calculateCardLayouts } from './utils/mathLayouts';
import { Heart, Sparkles, SlidersHorizontal, ArrowLeftRight, ChevronLeft, ChevronRight, LayoutGrid, Play, Pause, CloudCheck, CloudLightning, Database, LogOut, UserCheck, ShieldCheck, HelpCircle } from 'lucide-react';

// Pre-seeded high quality memories
const INITIAL_MEMORIES: PhotoCardType[] = [
  {
    id: 'm1',
    url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop',
    title: '初次邂逅 · 暖色午后',
    description: '咖啡屋窗棂有暖光。你抱着一本诗集，抬头刚好撞进我的眼神里。那一刻，心跳像一万只蝴蝶齐飞。',
    location: 'Sweet Cafe 二楼',
    date: '2024-05-20',
    tags: ['初遇', '心动'],
  },
  {
    id: 'm2',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    title: '拾秋枫林 · 微风不燥',
    description: '踩着落叶清脆的轻响。你把手揣进我的大衣口袋，暖意顺着指尖流淌进心里，好像把一整个秋天搂进了怀。',
    location: '原始红枫谷林区',
    date: '2024-10-01',
    tags: ['秋林', '散步'],
  },
  {
    id: 'm3',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop',
    title: '繁星许愿 · 炽热营火',
    description: '夜空缀满繁星，营火在晚风中发出劈啪轻响。我们并肩许下心愿，火焰映红了你的侧脸，比漫天星辰还要明亮璀璨。',
    location: 'Starry Valley 露营地',
    date: '2024-12-24',
    tags: ['璀璨', '篝火'],
  },
  {
    id: 'm4',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
    title: '海风吹拂 · 橘子海日落',
    description: '潮汐漫过白沙滩。夕阳像一颗融化的橘子糖没入地平线。你踩着水花踏歌，笑里沾着咸咸海浪的味道。',
    location: 'Horizon 黄金湾',
    date: '2025-04-12',
    tags: ['海风', '落日'],
  },
  {
    id: 'm5',
    url: 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?q=80&w=600&auto=format&fit=crop',
    title: '避雨屋檐 · 手中余温',
    description: '青石古街落着淅沥的梅雨。我们缩在古朴牌楼的雕花屋檐，雨珠顺着瓦片坠落，可心头却因为并肩依偎而滚烫。',
    location: '云烟古镇巷中',
    date: '2025-05-15',
    tags: ['避雨', '雨街'],
  },
  {
    id: 'm6',
    url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=600&auto=format&fit=crop',
    title: '手制蛋糕 · 奶油吻面',
    description: '亲手为你烘烤的草莓蛋糕，你大笑着把一抹香甜的奶油抹在我的鼻尖。那一瞬间，整个世界都溢满了甜甜的味道。',
    location: 'Sweet Home 厨房',
    date: '2025-06-18',
    tags: ['手作', '蛋糕'],
  },
  {
    id: 'm7',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
    title: '落日吻别 · 浪漫流连',
    description: '在日落黄昏下给彼此一个拥抱。晚霞的紫红色照得天际美如画卷，只盼执手百年，岁岁有今日。',
    location: '心动天台',
    date: '2026-05-20',
    tags: ['拥抱', '约定'],
  }
];

export default function App() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('scatter');

  // Security Credentials & Cloud States
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  
  // Admin Inspector sandboxed phone state
  const [inspectedUser, setInspectedUser] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Core configuration and photo memory state, initially loaded from cloud
  const [memories, setMemories] = useState<PhotoCardType[]>(INITIAL_MEMORIES);
  const [config, setConfig] = useState<CoupleConfig>({
    partnerA: 'W',
    partnerB: 'Y',
    anniversaryDate: '2024-05-20',
    albumTitle: '相册回忆录',
    bgVibe: 'dreamy',
  });

  const isLoadedRef = useRef(false);

  // Helper hook: auto-login and retrieve user configurations on start
  useEffect(() => {
    const autoLogin = async () => {
      const persistedToken = localStorage.getItem('couple_token');
      if (persistedToken) {
        try {
          const res = await fetch('/api/user/data', {
            headers: { 'Authorization': `Bearer ${persistedToken}` }
          });
          const result = await res.json();
          if (res.ok && result.success) {
            setAuthToken(persistedToken);
            setUserPhone(result.data.phone);
            setUserRole(result.data.role);
            setConfig(result.data.config);
            setMemories(result.data.memories);
            isLoadedRef.current = true;
          } else {
            localStorage.removeItem('couple_token');
          }
        } catch (error) {
          console.error('Verify login error:', error);
        }
      }
      setIsVerifyingAuth(false);
    };
    autoLogin();
  }, []);

  // Sync state changes in 'config' or 'memories' to persistent database automatically
  useEffect(() => {
    if (!authToken || !isLoadedRef.current) return;

    // Debounce updates by 1 second to avoid excessive network requests
    setSyncStatus('saving');
    const syncUrl = inspectedUser 
      ? `/api/user/sync?inspectPhone=${encodeURIComponent(inspectedUser)}`
      : '/api/user/sync';

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ config, memories })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        setSyncStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [config, memories, authToken, inspectedUser]);

  // Hook: trigger loading inspected user's data when the Administrator inspects a different account
  useEffect(() => {
    if (!authToken || userRole !== 'admin') return;
    if (!inspectedUser) {
      // Restore Admin's own dashboard workspace when they close the inspector
      const reloadAdminOwnData = async () => {
        try {
          const res = await fetch('/api/user/data', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const result = await res.json();
          if (res.ok && result.success) {
            setConfig(result.data.config);
            setMemories(result.data.memories);
          }
        } catch (err) {
          console.error(err);
        }
      };
      reloadAdminOwnData();
      return;
    }

    const loadInspectedUser = async () => {
      isLoadedRef.current = false; // suspend sync triggers momentarily during transition load
      try {
        const res = await fetch(`/api/user/data?inspectPhone=${encodeURIComponent(inspectedUser)}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const result = await res.json();
        if (res.ok && result.success) {
          setConfig(result.data.config);
          setMemories(result.data.memories);
          // Wait briefly then reactivate sync triggers so edits persist to the correct sandbox!
          setTimeout(() => {
            isLoadedRef.current = true;
          }, 150);
        }
      } catch (err) {
        console.error('Inspector pull failure:', err);
      }
    };
    loadInspectedUser();
  }, [inspectedUser, authToken, userRole]);

  const [activeStackIndex, setActiveStackIndex] = useState(0);
  const [spiralSpinAngle, setSpiralSpinAngle] = useState(0); // For continuous dragging rotation in 3D spiral carousel
  const [selectedCard, setSelectedCard] = useState<PhotoCardType | null>(null);

  // Free dragging offsets for each card in all layouts
  const [draggedOffsets, setDraggedOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const activeDragCardIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);
  const lastInteractionTimeRef = useRef<number>(0);
  const totalDragDistRef = useRef<number>(0);

  // Intro states - session cached for better developer review UX
  const [introState, setIntroState] = useState<'not-started' | 'running' | 'completed'>(() => {
    const isCompleted = sessionStorage.getItem('intro_completed') === 'true';
    return isCompleted ? 'completed' : 'not-started';
  });

  const [hasFlownIn, setHasFlownIn] = useState(() => {
    return sessionStorage.getItem('intro_completed') === 'true';
  });

  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const lastWheelTimeRef = useRef<number>(0);

  // Switch layout modes with mouse wheel scroll up / down
  useEffect(() => {
    const MODES: LayoutMode[] = ['scatter', 'heart', 'stack', 'grid'];
    
    const handleWheel = (e: WheelEvent) => {
      // Do not switch layout if there is an active details modal open
      if (selectedCard || introState !== 'completed') return;

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 650) {
        return; // debounce rapidly occurring wheel events
      }

      if (Math.abs(e.deltaY) > 24) {
        lastWheelTimeRef.current = now;
        setLayoutMode((prev) => {
          const currentIndex = MODES.indexOf(prev);
          let nextIndex = 0;
          if (e.deltaY > 0) {
            // Scroll down: next arrangement
            nextIndex = (currentIndex + 1) % MODES.length;
          } else {
            // Scroll up: previous arrangement
            nextIndex = (currentIndex - 1 + MODES.length) % MODES.length;
          }
          const nextMode = MODES[nextIndex];
          if (nextMode === 'stack') {
            setActiveStackIndex(0);
          }
          return nextMode;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedCard, introState]);

  // Persist memories safely
  useEffect(() => {
    try {
      localStorage.setItem('couple_memories', JSON.stringify(memories));
    } catch (e) {
      console.warn('Failed to store couple_memories in localStorage (quota exceeded or sandboxed):', e);
    }
  }, [memories]);

  // Automatic cycle layout modes periodically
  useEffect(() => {
    if (!isAutoCycling || introState !== 'completed') return;

    const MODES: LayoutMode[] = ['scatter', 'heart', 'stack', 'grid'];
    const timer = setInterval(() => {
      // Allow mode switching only if no interaction happened in the past 10 seconds
      const timeSinceLastDragInteraction = Date.now() - lastInteractionTimeRef.current;
      if (timeSinceLastDragInteraction < 10000) {
        return; 
      }
      if (activeDragCardIdRef.current) {
        return;
      }

      setLayoutMode((prev) => {
        const nextIdx = (MODES.indexOf(prev) + 1) % MODES.length;
        const nextMode = MODES[nextIdx];
        if (nextMode === 'stack') {
          setActiveStackIndex(0);
        }
        return nextMode;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoCycling, introState]);

  const handleIntroComplete = () => {
    setIntroState('completed');
    sessionStorage.setItem('intro_completed', 'true');
    // Swoop photos from all directions into the screen immediately
    setTimeout(() => {
      setHasFlownIn(true);
    }, 150);
  };

  // Add new memories card
  const handleAddCard = (newCard: PhotoCardType) => {
    setMemories((prev) => [newCard, ...prev]);
    setActiveStackIndex(0); // reset active stack focus
  };

  // Sync AI commentaries returned by Gemini modal
  const handleUpdateCardComment = (cardId: string, commentText: string) => {
    setMemories((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, aiCommentary: commentText } : c))
    );
    // synchronize active selected card preview if currently open
    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard((prev) => prev ? { ...prev, aiCommentary: commentText } : null);
    }
  };

  // Handle full card updates (including editing title, detail descriptions and replacing photos)
  const handleUpdateCard = (updatedCard: PhotoCardType) => {
    setMemories((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
    setSelectedCard(updatedCard);
  };

  // Handle deleting card
  const handleDeleteCard = (cardId: string) => {
    setMemories((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard(null);
  };

  // Card Pointer Events for Free dragging in all layout modes
  const handleCardPointerDown = (cardId: string, e: React.PointerEvent<HTMLDivElement>) => {
    lastInteractionTimeRef.current = Date.now();
    if (e.button !== 0) return;
    
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const currentOffset = draggedOffsets[cardId] || { x: 0, y: 0 };
    activeDragCardIdRef.current = cardId;
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: currentOffset.x,
      initialY: currentOffset.y,
    };
    totalDragDistRef.current = 0;
  };

  const handleCardPointerMove = (cardId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragCardIdRef.current !== cardId || !dragStartPosRef.current) return;
    
    lastInteractionTimeRef.current = Date.now();
    const dx = e.clientX - dragStartPosRef.current.mouseX;
    const dy = e.clientY - dragStartPosRef.current.mouseY;
    
    totalDragDistRef.current = Math.sqrt(dx * dx + dy * dy);
    
    setDraggedOffsets((prev) => ({
      ...prev,
      [cardId]: {
        x: dragStartPosRef.current!.initialX + dx,
        y: dragStartPosRef.current!.initialY + dy,
      },
    }));
  };

  const handleCardPointerUp = (cardId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragCardIdRef.current === cardId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      activeDragCardIdRef.current = null;
      dragStartPosRef.current = null;
      lastInteractionTimeRef.current = Date.now();
    }
  };

  // Handle slide/spin incrementer in 3D spiral carousel mode
  const spinSpiral = (dir: 'left' | 'right') => {
    const shift = 360 / memories.length;
    setSpiralSpinAngle((prev) => prev + (dir === 'left' ? -shift : shift));
  };

  // Drag listeners to spin the spiral carousel with hand gestures
  const dragStartRef = useRef<number | null>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    if (layoutMode !== 'spiral') return;
    dragStartRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (layoutMode !== 'spiral' || dragStartRef.current === null) return;
    const diff = e.clientX - dragStartRef.current;
    if (Math.abs(diff) > 10) {
      setSpiralSpinAngle((prev) => prev + diff * 0.15);
      dragStartRef.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  if (isVerifyingAuth) {
    return (
      <div className="min-h-screen w-screen bg-[#06020c] flex flex-col justify-center items-center font-mono text-xs text-pink-400 gap-3.5 select-none">
        <Heart className="h-8 w-8 text-pink-500 fill-pink-500/25 animate-pulse" />
        <span className="tracking-[0.12em] uppercase font-sans animate-pulse font-bold text-zinc-400 text-[10px]">
          正在安全接入恋人云相册数据库...
        </span>
      </div>
    );
  }

  if (!authToken) {
    return (
      <AuthScreen 
        onLoginSuccess={(token, phone, role, userConfig, userMemories) => {
          setAuthToken(token);
          setUserPhone(phone);
          setUserRole(role);
          if (userConfig) setConfig(userConfig);
          if (userMemories) setMemories(userMemories);
          isLoadedRef.current = true;
        }} 
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('couple_token');
    setAuthToken(null);
    setUserPhone(null);
    setUserRole(null);
    setInspectedUser(null);
    // Restore pre-seeded templates as fallbacks
    setMemories(INITIAL_MEMORIES);
    setConfig({
      partnerA: 'W',
      partnerB: 'Y',
      anniversaryDate: '2024-05-20',
      albumTitle: '相册回忆录',
      bgVibe: 'dreamy',
    });
    isLoadedRef.current = false;
  };

  return (
    <div
      className="relative min-h-screen w-screen bg-[#07030e] text-zinc-100 flex flex-col justify-between overflow-hidden cursor-default select-none animate-fade-in"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background twinkle star heart layer */}
      <BackgroundParticles vibe={config.bgVibe} />

      {/* FLOATING TOP UTILITIES - CLOUDSYNC AND ACCOUNT STATES */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none select-none">
        
        {/* Cloud AutoSync Status Panel */}
        <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-white/5 py-1.5 px-3.5 rounded-full shadow-lg">
          {syncStatus === 'synced' ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-emerald-400">
              <CloudCheck className="h-3.5 w-3.5" />
              已安全同步
            </span>
          ) : syncStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-pink-400 animate-pulse">
              <Database className="h-3.5 w-3.5 animate-spin" />
              自动同步中...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-yellow-400">
              <CloudLightning className="h-3.5 w-3.5 animate-bounce" />
              未安全连接
            </span>
          )}
        </div>

        {/* Global Admin Inspection Monitor */}
        {inspectedUser && (
          <div className="hidden md:flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 py-1.5 px-4 rounded-full text-[10px] font-extrabold text-pink-300 animate-pulse">
            <span>🔎 调试沙盒:</span>
            <span className="font-mono bg-pink-500/20 px-1.5 py-0.5 rounded text-white text-[11px]">{inspectedUser}</span>
            <button 
              onClick={() => setInspectedUser(null)}
              className="pointer-events-auto ml-1 font-mono text-zinc-400 hover:text-white underline cursor-pointer"
            >
              退出调试
            </button>
          </div>
        )}

        {/* User Account Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-md border border-white/5 p-1 rounded-full shadow-lg">
          <div className="flex items-center gap-1 px-3 py-1 hover:bg-white/5 rounded-full transition-all text-xs font-bold text-zinc-300 font-sans">
            <UserCheck className="h-3.5 w-3.5 text-pink-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              {userPhone === 'admin' ? '系统管理员' : `账号: ${userPhone}`}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="px-2.5 py-1 hover:bg-pink-500/10 border border-pink-500/20 rounded-full font-bold text-[9px] uppercase font-mono tracking-widest text-pink-400 hover:text-pink-300 transition-all cursor-pointer inline-flex items-center gap-1"
                title="开启管理员云面板"
              >
                <ShieldCheck className="h-3 w-3" />
                后台管理
              </button>
              <div className="h-4 w-[1px] bg-zinc-800" />
            </>
          )}

          <button
            onClick={handleLogout}
            className="p-1 px-2.5 rounded-full text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer flex items-center gap-1"
            title="退出账号登录"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="text-[8px] tracking-wider uppercase font-bold">登出</span>
          </button>
        </div>

      </div>

      {/* FIXED FLOATING HEADERS */}
      <header className="relative w-full text-center pt-16 md:pt-12 shrink-0 z-20 select-none">
        <div className="inline-block px-4 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 backdrop-blur-md">
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-pink-400 font-bold flex items-center justify-center gap-1.5">
            <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
            {config.partnerA || 'W'} & {config.partnerB || 'Y'} · IMMERSIVE SCRAPBOOK
          </span>
        </div>
        
        <h1 className="text-2xl md:text-3.5xl font-sans tracking-tight font-extrabold text-white mt-3 text-glow transition-all duration-500">
          {config.albumTitle || '相册回忆录'}
        </h1>
        <p className="text-[10px] md:text-xs text-zinc-400 font-mono uppercase tracking-[0.15em] mt-1">
          Powered with Gemini 3.5 Flash Vibe Engine
        </p>
      </header>

      {/* CORE BOARD AREA - MOUNT ABSOLUTELY ALIGN CARDS */}
      <main
        className="relative flex-1 w-full flex items-center justify-center overflow-visible select-none z-10"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 max-w-7xl mx-auto flex items-center justify-center">
          {memories.map((card, idx) => {
            const calculated = calculateCardLayouts(
              idx,
              memories.length,
              layoutMode,
              spiralSpinAngle,
              activeStackIndex
            );

            const offset = draggedOffsets[card.id] || { x: 0, y: 0 };
            const isCardDragged = activeDragCardIdRef.current === card.id;

            // High-fidelity motion: start off-screen in random radial directions, then swarm into the layout grid.
            let styleOverride: React.CSSProperties = {
              left: calculated.left,
              top: calculated.top,
              transform: `${calculated.transform} translate3d(${offset.x}px, ${offset.y}px, 0px)`,
              zIndex: isCardDragged ? 9999 : calculated.zIndex,
              opacity: 1,
              transition: isCardDragged
                ? 'opacity 300ms, transform 0ms'
                : 'all 1400ms cubic-bezier(0.19, 1, 0.22, 1)', // cinematic smooth landing
              transitionDelay: isCardDragged ? '0ms' : `${idx * 40}ms`, // beautiful wave-like staggered transitions
            };

            if (!hasFlownIn) {
              const angle = (idx * 2 * Math.PI) / (memories.length || 5);
              const distance = 160; // Push off-screen viewport percentage
              const offX = Math.cos(angle) * distance;
              const offY = Math.sin(angle) * distance;
              styleOverride = {
                left: `calc(50% + ${offX}vw)`,
                top: `calc(50% + ${offY}vh)`,
                transform: 'translate(-50%, -50%) scale(0.05) rotate(720deg)',
                opacity: 0,
                zIndex: 100,
              };
            }

            return (
              <PhotoCard
                key={card.id}
                card={card}
                onClick={() => {
                  // If the user has dragged more than a tiny visual threshold, prevent selecting/opening the card
                  if (totalDragDistRef.current > 7) {
                    return;
                  }
                  if (layoutMode === 'stack') {
                    const offsetFromActive = (idx - activeStackIndex + memories.length) % memories.length;
                    if (offsetFromActive !== 0) {
                      // bring to front if clicked layered background card in pile
                      setActiveStackIndex(idx);
                      return;
                    }
                  }
                  setSelectedCard(card);
                }}
                style={styleOverride}
                isActiveStack={layoutMode === 'stack' && idx === activeStackIndex}
                onPointerDown={(e) => handleCardPointerDown(card.id, e)}
                onPointerMove={(e) => handleCardPointerMove(card.id, e)}
                onPointerUp={(e) => handleCardPointerUp(card.id, e)}
              />
            );
          })}
        </div>


      </main>

      {/* FLOATING CONTROLS PANEL IN BOTTOM RIGHT */}
      <div className="fixed bottom-4 right-4 md:right-6 z-40 flex items-center gap-2 bg-zinc-950/85 backdrop-blur-xl border border-pink-500/10 p-2.5 rounded-2xl shadow-2xl select-none">
        {/* Autoplay status toggle switch */}
        <button
          onClick={() => setIsAutoCycling(!isAutoCycling)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            isAutoCycling
              ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400 font-extrabold shadow-sm'
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
          }`}
          title={isAutoCycling ? "点击暂停自动轮播模式" : "点击开启循环阵列自动演示"}
        >
          <span className={`h-2 w-2 rounded-full inline-block ${isAutoCycling ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-650'}`} />
          {isAutoCycling ? '自动轮播：开启' : '自动轮播：关闭'}
        </button>

        <div className="h-6 w-[1px] bg-zinc-800" />

        {/* Re-enter Website Button to play intro again */}
        <button
          onClick={() => {
            sessionStorage.removeItem('intro_completed');
            setIntroState('not-started');
            setHasFlownIn(false);
          }}
          className="px-3 py-2 rounded-xl text-xs font-bold border border-pink-500/20 bg-pink-950/20 text-pink-400 hover:bg-pink-900/30 hover:text-pink-300 hover:scale-105 active:scale-95 duration-200 transition-all cursor-pointer flex items-center gap-1.5"
          title="重新体验浪漫的入场电影效果"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-pink-400" />
          <span>重新进入网站</span>
        </button>
      </div>

      {/* Intro flight-through space overlay and persistent cosmic stars background */}
      <IntroFlyThrough
        isCompleted={introState === 'completed'}
        onComplete={handleIntroComplete}
        partnerA={config.partnerA}
        partnerB={config.partnerB}
      />

      {/* DETACHED CONTROLS AND DIALOG OVERLAYS */}
      <AudioPlayer partnerA={config.partnerA} partnerB={config.partnerB} />
      <ConfigPanel config={config} onChange={setConfig} />
      <PhotoCreator onAddCard={handleAddCard} />

      {/* Details inspector popup modal window */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          config={config}
          onClose={() => setSelectedCard(null)}
          onUpdateCardComment={handleUpdateCardComment}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
        />
      )}

      {/* Admin Panel Console Portal Overlay */}
      {isAdminPanelOpen && authToken && (
        <AdminPanel
          authToken={authToken}
          onInspectUser={(phone) => {
            setInspectedUser(phone);
            setIsAdminPanelOpen(false);
          }}
          activeInspectedUser={inspectedUser}
          onExitInspect={() => setInspectedUser(null)}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {/* Persistent floating indicator of sandboxed viewing session (Mobile-optimized fallback) */}
      {inspectedUser && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 md:hidden bg-pink-600/95 backdrop-blur-md text-white border border-white/20 py-1.5 px-3.5 rounded-full flex items-center gap-2 shadow-xl text-[10px] font-extrabold">
          <span>🔎 正在调试: {inspectedUser}</span>
          <button 
            onClick={() => setInspectedUser(null)}
            className="underline text-pink-100 font-extrabold cursor-pointer"
          >
            退出调试
          </button>
        </div>
      )}
    </div>
  );
}
