export interface PhotoCardType {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  aiCommentary?: string;
  tags?: string[];
}

export type LayoutMode = 'scatter' | 'heart' | 'spiral' | 'stack' | 'grid';

export interface CoupleConfig {
  partnerA: string;
  partnerB: string;
  anniversaryDate: string;
  albumTitle: string;
  bgVibe: 'dreamy' | 'ocean' | 'galaxy' | 'forest';
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}
