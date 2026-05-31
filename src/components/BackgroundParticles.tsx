import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  spin: number;
  opacity: number;
  character: string;
  color: string;
}

interface ClickHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
}

interface BackgroundParticlesProps {
  vibe: 'dreamy' | 'ocean' | 'galaxy' | 'forest';
}

export default function BackgroundParticles({ vibe }: BackgroundParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clickHearts, setClickHearts] = useState<ClickHeart[]>([]);
  const clickIdCounter = useRef(0);

  // Background gradient and themed particles
  const getThemeConfig = () => {
    switch (vibe) {
      case 'ocean':
        return {
          gradientStart: '#11224d', // brighter midnight royal blue
          gradientEnd: '#063d66',   // oceanic sapphire night
          particles: ['💖', '💕', '❤️', '💝'], // Fixed to beautiful hearts to stay consistent with main theme
          starColor: 'rgba(100, 210, 255, ',
          particleSpeedScale: 0.6,
        };
      case 'galaxy':
        return {
          gradientStart: '#190a3b', // violet star field
          gradientEnd: '#370b5c',   // deep galaxy nebula
          particles: ['💖', '💕', '❤️', '💝'],
          starColor: 'rgba(216, 180, 254, ',
          particleSpeedScale: 0.8,
        };
      case 'forest':
        return {
          gradientStart: '#082e16', // bright velvet emerald
          gradientEnd: '#135c2b',   // warm forest magic
          particles: ['💖', '💕', '❤️', '💝'],
          starColor: 'rgba(110, 255, 150, ',
          particleSpeedScale: 0.5,
        };
      case 'dreamy':
      default:
        return {
          gradientStart: '#200c3b', // rich star night cosmic amethyst
          gradientEnd: '#541044',   // raspberry cosmos warm glow
          particles: ['💖', '💕', '❤️', '💝'],
          starColor: 'rgba(244, 114, 182, ', // lovely pink sparks
          particleSpeedScale: 0.7,
        };
    }
  };

  const theme = getThemeConfig();
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseRef.current.targetY = (e.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // No longer generate duplicate duplicate background stars or downward floating particles to ensure background uses IntroFlyThrough's elegant cruising movement.
    const stars: { x: number; y: number; size: number; phase: number; speed: number }[] = [];
    const activeParticles: Particle[] = [];

    const render = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      // Make the background wrapper canvas completely transparent to perfectly reveal the warp fly-through cruising stars
      ctx.clearRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [vibe, theme.starColor, theme.gradientStart, theme.gradientEnd]);

  // Handle user clicks to emit star heart splash sparkles
  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('.interactive-card') ||
        target.closest('#config-trigger-panel') ||
        target.closest('#photo-creator-form')
      ) {
        return;
      }

      const id = ++clickIdCounter.current;
      const count = 6 + Math.floor(Math.random() * 5);
      const newHearts: ClickHeart[] = [];
      const emojis = theme.particles;

      for (let i = 0; i < count; i++) {
        const size = 15 + Math.random() * 18;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        newHearts.push({
          id: id * 100 + i,
          x: e.clientX,
          y: e.clientY,
          size,
          opacity: 1,
          vx: Math.cos(angle) * speed,
          vy: -Math.abs(Math.sin(angle) * speed) - 0.8,
          rotation: Math.random() * Math.PI * 2,
          spin: Math.random() * 0.1 - 0.05,
        });
      }

      setClickHearts((prev) => [...prev, ...newHearts].slice(-80));
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [theme.particles]);

  useEffect(() => {
    if (clickHearts.length === 0) return;

    const timer = setInterval(() => {
      setClickHearts((prev) => {
        return prev
          .map((h) => ({
            ...h,
            x: h.x + h.vx,
            y: h.y + h.vy,
            vy: h.vy + 0.06, // gravity pulls the sparkles down elegantly
            opacity: h.opacity - 0.016,
            rotation: h.rotation + h.spin,
          }))
          .filter((h) => h.opacity > 0);
      });
    }, 16);

    return () => clearInterval(timer);
  }, [clickHearts]);

  return (
    <div id="particles-wrapper" className="absolute inset-0 overflow-hidden select-none pointer-events-none z-0" ref={containerRef}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Floating Sparkles Div Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
        {clickHearts.map((h) => {
          const char = theme.particles[Math.floor(h.id % theme.particles.length)];
          return (
            <div
              key={h.id}
              className="absolute select-none pointer-events-none"
              style={{
                left: h.x,
                top: h.y,
                transform: `translate(-50%, -50%) rotate(${h.rotation}rad) scale(${h.size / 24})`,
                opacity: h.opacity,
                fontSize: '24px',
                transition: 'opacity 0.05s linear',
              }}
            >
              {char}
            </div>
          );
        })}
      </div>
    </div>
  );
}
