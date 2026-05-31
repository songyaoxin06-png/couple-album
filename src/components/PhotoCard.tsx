import React from 'react';
import { PhotoCardType } from '../types';
import { Heart, MapPin, Sparkles } from 'lucide-react';

interface PhotoCardProps {
  key?: string;
  card: PhotoCardType;
  style: React.CSSProperties;
  onClick: () => void;
  isActiveStack: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export default function PhotoCard({ card, style, onClick, isActiveStack, onPointerDown, onPointerMove, onPointerUp }: PhotoCardProps) {
  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`absolute interactive-card group select-none transition-all duration-700 ease-out bg-zinc-950 rounded-xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_40px_rgba(236,72,153,0.4)] hover:-translate-y-2 border border-white/10 cursor-pointer aspect-[3/4] ${
        isActiveStack ? 'ring-2 ring-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.6)] z-50' : 'opacity-100'
      }`}
      style={{
        ...style,
        width: '140px',
        maxWidth: '30vw',
        backfaceVisibility: 'hidden',
        touchAction: 'none',
      }}
    >
      {/* Image filling the entire card */}
      <img
        src={card.url}
        alt={card.title}
        className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        draggable="false"
        referrerPolicy="no-referrer"
      />

      {/* Elegant dark gradient overlay to guarantee readability of the white lyrics/labels */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

      {/* Small AI hint badge if generated */}
      {card.aiCommentary && (
        <div className="absolute top-2 right-2 bg-pink-500/90 text-white rounded-full p-1.5 shadow-lg backdrop-blur-sm z-10 animate-pulse">
          <Sparkles className="h-3 w-3" />
        </div>
      )}

      {/* Overlay write-up with white text and styling */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h5 className="font-sans font-extrabold text-white text-[12px] leading-tight truncate flex items-center gap-1">
          <Heart className="h-3 w-3 text-pink-400 fill-pink-400 shrink-0" />
          {card.title}
        </h5>
        
        <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-zinc-300 tracking-tight">
          <span>{card.date}</span>
          {card.location && (
            <span className="truncate max-w-[80px] flex items-center justify-end text-zinc-200">
              <MapPin className="h-2.5 w-2.5 mr-0.5 text-pink-400" />
              {card.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
