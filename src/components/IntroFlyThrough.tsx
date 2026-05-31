import React, { useEffect, useRef, useState } from 'react';
import { Heart, Sparkles, Navigation } from 'lucide-react';

interface IntroFlyThroughProps {
  onComplete: () => void;
  partnerA: string;
  partnerB: string;
  isCompleted: boolean;
}

export default function IntroFlyThrough({ onComplete, partnerA, partnerB, isCompleted }: IntroFlyThroughProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  // Setup 3D warp space stars
  const starsRef = useRef<{ x: number; y: number; z: number }[]>([]);
  // Setup 3D warp space hearts
  const heartsRef = useRef<{ x: number; y: number; z: number; size: number; rotation: number; speedOffset: number }[]>([]);

  useEffect(() => {
    // Generate an expansive star field with 5000 stars (星星再多加一些!)
    const starList = [];
    for (let i = 0; i < 5000; i++) {
      starList.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        z: Math.random() * 1000,
      });
    }
    starsRef.current = starList;

    // Generate 320 small 3D hearts flying (迎面而来的小爱心)
    const heartList = [];
    for (let i = 0; i < 320; i++) {
      heartList.push({
        x: (Math.random() - 0.5) * 3500,
        y: (Math.random() - 0.5) * 3500,
        z: Math.random() * 1000,
        size: Math.random() * 0.9 + 0.4, // larger and more noticeable!
        rotation: Math.random() * Math.PI * 2,
        speedOffset: Math.random() * 0.5 + 0.8,
      });
    }
    heartsRef.current = heartList;
  }, []);

  const triggerWarpSpeed = () => {
    setHasStarted(true);
    startTimeRef.current = performance.now();

    // Force trigger background audio playback automatically to satisfy browser rules safely
    const musicBtn = document.getElementById('music-play-btn');
    if (musicBtn) {
      musicBtn.click();
    }
  };

  useEffect(() => {
    if (isCompleted) {
      setHasStarted(true);
      if (startTimeRef.current === null) {
        startTimeRef.current = performance.now() - 8000; // set starting time such that it is already in the cruising phase
        hasCompletedRef.current = true;
      }
    } else {
      // Cleanly reset everything so that re-entering website is fully responsive and starts fresh!
      setHasStarted(false);
      startTimeRef.current = null;
      hasCompletedRef.current = false;
    }
  }, [isCompleted]);

  useEffect(() => {
    if (!hasStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const runWarp = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = (now - startTimeRef.current) / 1000; // in seconds

      // 1. Calculate travel velocity with requested high-precision curve:
      // - First 1s: Acceleration (先加速1秒)
      // - Next 1s: Constant speed (然后匀速1秒)
      // - From 2.0s to 5.0s: Decelerating smoothly to a complete stop (然后减速到停止), trigger photo fly-in at 2.0s
      // - From 5.0s to 7.0s: Gradually accelerate back to cruising speed (然后再次开始匀速前进)
      // - Onwards: Keep moving forward gracefully (首页星星和爱心，也是迎面扑来的动作)
      let velocity = 34.0;
      let velocityMultiplier = 0;

      if (elapsed < 1.0) {
        // Accelerate phase (0 to 1s)
        const t = elapsed / 1.0;
        velocityMultiplier = t;
      } else if (elapsed < 2.0) {
        // Constant speed phase (1s to 2s)
        velocityMultiplier = 1.0;
      } else if (elapsed < 5.0) {
        // Decelerate smoothly to a complete stop (2s to 5s)
        const decFraction = (elapsed - 2.0) / 3.0; // 3 seconds total
        velocityMultiplier = Math.cos((decFraction * Math.PI) / 2);
      } else if (elapsed < 7.0) {
        // Re-accelerate to constant cruising speed (5s to 7s)
        const accFraction = (elapsed - 5.0) / 2.0; // 2 seconds transition
        const targetCruise = 0.16;
        const ease = (1 - Math.cos(accFraction * Math.PI)) / 2;
        velocityMultiplier = ease * targetCruise;
      } else {
        // Constant elegant cruising speed for homepage backdrop (7s onwards)
        velocityMultiplier = 0.16;
      }

      // Trigger photo card entry when deceleration starts at exactly 2.0s! (同时照片涌入)
      if (elapsed >= 2.0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }

      const activeSpeed = velocity * velocityMultiplier;

      // Draw backdrop dark blue nebula consistently
      ctx.fillStyle = '#07030e';
      ctx.fillRect(0, 0, width, height);

      // Render cosmic background stars falling
      const stars = starsRef.current;
      ctx.strokeStyle = `rgba(244, 114, 182, ${0.35 * Math.max(0.15, velocityMultiplier)})`;
      ctx.lineWidth = 1.5;

      const centerX = width / 2;
      const centerY = height / 2;

      stars.forEach((star) => {
        // move stars in 3D depth towards viewer
        star.z -= activeSpeed;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * 4000;
          star.y = (Math.random() - 0.5) * 4000;
          star.z = 1000;
        }

        // project to 2D
        const px = (star.x / star.z) * 400 + centerX;
        const py = (star.y / star.z) * 400 + centerY;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          // calculate streak line length based on velocity
          const tailZ = star.z + activeSpeed * 2.5;
          const pxt = (star.x / tailZ) * 400 + centerX;
          const pyt = (star.y / tailZ) * 400 + centerY;

          const size = Math.max(0.2, (1 - star.z / 1000) * 3);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(pxt, pyt);
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, 1.2 - star.z / 1000)})`;
          ctx.fillRect(px - size/2, py - size/2, size, size);
        }
      });

      const drawSmallHeart = (c: CanvasRenderingContext2D, hx: number, hy: number, size: number, opacity: number, rot: number) => {
        c.save();
        c.translate(hx, hy);
        c.rotate(rot);
        c.scale(size, size);
        
        c.fillStyle = `rgba(244, 63, 94, ${opacity})`; // bright rose-500
        c.shadowColor = 'rgba(236, 72, 153, 0.8)';
        c.shadowBlur = 10;
        
        c.beginPath();
        // Plot small heart
        c.moveTo(0, -3);
        c.bezierCurveTo(-2, -6, -6, -6, -6, -2);
        c.bezierCurveTo(-6, 2, -1, 5, 0, 8);
        c.bezierCurveTo(1, 5, 6, 2, 6, -2);
        c.bezierCurveTo(6, -6, 2, -6, 0, -3);
        c.closePath();
        c.fill();
        c.restore();
      };

      // Render beautiful incoming small 3D hearts (迎面而来的小爱心)
      const hearts = heartsRef.current;
      hearts.forEach((heart) => {
        heart.z -= activeSpeed * heart.speedOffset;

        if (heart.z <= 0) {
          heart.x = (Math.random() - 0.5) * 3000;
          heart.y = (Math.random() - 0.5) * 3000;
          heart.z = 1000;
          heart.rotation = Math.random() * Math.PI * 2;
        }

        const hx = (heart.x / heart.z) * 400 + centerX;
        const hy = (heart.y / heart.z) * 400 + centerY;

        if (hx >= -50 && hx <= width + 50 && hy >= -50 && hy <= height + 50) {
          const depthMultiplier = 1 - heart.z / 1000;
          const baseSize = heart.size * 1.5 * Math.max(0.1, depthMultiplier);
          const opacity = Math.min(1.0, depthMultiplier * 1.6) * (0.35 + 0.65 * Math.max(0.15, velocityMultiplier));
          if (opacity > 0.05) {
            drawSmallHeart(ctx, hx, hy, baseSize, opacity, heart.rotation);
          }
        }
      });

      // Big heart deleted as per user request to improve the view and let stars and photos shine
      if (elapsed < 5.5) {
        // Render countdown timer overlay text at warp phase only
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WARPING SPACE ... ${Math.max(0, 5.5 - elapsed).toFixed(1)}S`, centerX, height - 60);

        // Lovely floating indicator details
        ctx.fillStyle = 'rgba(244, 114, 182, 0.8)';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${partnerA || 'A'} ❤ ${partnerB || 'B'} 的梦幻星空`, centerX, height - 100);
      }

      animationRef.current = requestAnimationFrame(runWarp);
    };

    animationRef.current = requestAnimationFrame(runWarp);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [hasStarted, partnerA, partnerB, onComplete]);

  if (!hasStarted && !isCompleted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07030e] text-center p-8 select-none">
        {/* Glowing Ambient Background Ring */}
        <div className="absolute h-96 w-96 rounded-full bg-pink-500/10 filter blur-3xl animate-pulse" />

        <div className="relative max-w-md bg-zinc-900/80 border border-pink-500/20 p-8 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center animate-bounce duration-1000">
            <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-pink-400 font-bold block">
              COSMIC LOVE MEMORIES
            </span>
            <h2 className="text-zinc-100 text-2xl font-black tracking-tight leading-tight">
              开启属于 {partnerA || 'W'} 与 {partnerB || 'Y'} 的梦幻空间
            </h2>
            <p className="text-zinc-400 text-xs px-2 leading-relaxed">
              相册搭载了 3D 旋转圆柱、重力飘散等多种电影级粒子特效。点击下方按钮，伴随《直到你降临》的经典旋律起航。
            </p>
          </div>

          {/* Start Flight Trigger Button */}
          <button
            onClick={triggerWarpSpeed}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-pink-500/20 active:scale-95 hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Navigation className="h-4 w-4 rotate-45 text-pink-100" />
            开启梦幻闪烁之旅
          </button>

          <span className="text-[9px] text-zinc-600 font-mono">
            * 开启需要播放背景音效权限
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${isCompleted ? 'z-[2] opacity-100 pointer-events-none' : 'z-50'} select-none overflow-hidden block`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
