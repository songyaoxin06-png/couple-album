import { LayoutMode } from '../types';

interface CalculatedStyle {
  left: string;
  top: string;
  transform: string;
  zIndex: number;
}

/**
 * Calculates positions based on the selected LayoutMode.
 * Coordinates are centered around (X = 0, Y = 0) in percentage offsets or 3D pixel offsets.
 */
export function calculateCardLayouts(
  index: number,
  total: number,
  mode: LayoutMode,
  extraRotationOffset: number = 0, // Used for 3D continuous dragging spin spinner
  activeStackIndex: number = 0
): CalculatedStyle {
  const angleStep = (2 * Math.PI) / total;

  switch (mode) {
    case 'heart': {
      // Heart mathematical spline:
      // t ranges from 0 to 2*PI, offset starting point to make it upright
      const t = index * angleStep - Math.PI / 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      // Flg Y is inverted in screen space versus cartesian coordinates
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      // Scaling factors to spread nicely in viewport percentages
      const scaleX = 2.4;
      const scaleY = 2.0;

      const posX = x * scaleX;
      const posY = y * scaleY - 5; // offset slightly high to center target

      // Cards face outwards or slightly twist for handrafted look
      const rot = Math.sin(t) * 12;

      return {
        left: `calc(50% + ${posX}vw)`,
        top: `calc(50% + ${posY}vh)`,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(0.9)`,
        zIndex: 10 + index,
      };
    }

    case 'spiral':
    case 'stack': {
      // Cascade card deck stacked into elegant "Cross Shape" (十字型叠放)
      // Each cross contains up to 5 cards (0: Center, 1: Top, 2: Bottom, 3: Left, 4: Right)
      // Consecutive cards overlap half of the previous card's dimensions.
      // If we have more than 5 cards, we build multiple crosses centered side-by-side!
      
      const crossIndex = Math.floor(index / 5);
      const positionInCross = index % 5;
      const numCrosses = Math.ceil(total / 5);
      
      // Spacing between multiple crosses horizontally (clean layout nesting)
      const spacingX = 200; 
      const startX = -((numCrosses - 1) * spacingX) / 2;
      const crossCenterX = startX + crossIndex * spacingX;
      
      // Calculate offsets based on cross role (Width: 140px, Height: ~187px)
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      let zIndex = 11;
      
      const halfWidth = 70;
      const halfHeight = 93;
      
      switch (positionInCross) {
        case 0: // Center
          dx = 0;
          dy = 0;
          rotation = 0;
          zIndex = 20; // Center sitting proudly on top
          break;
        case 1: // Top (overlaid on top half of center)
          dx = 0;
          dy = -halfHeight;
          rotation = -3; // elegant handcrafted organic tilt
          zIndex = 16;
          break;
        case 2: // Bottom (overlaid on bottom half of center)
          dx = 0;
          dy = halfHeight;
          rotation = 3;
          zIndex = 17;
          break;
        case 3: // Left (overlaid on left half of center)
          dx = -halfWidth;
          dy = 0;
          rotation = -2;
          zIndex = 18;
          break;
        case 4: // Right (overlaid on right half of center)
          dx = halfWidth;
          dy = 0;
          rotation = 2;
          zIndex = 19;
          break;
      }
      
      const totalX = crossCenterX + dx;
      const totalY = dy;
      
      return {
        left: `calc(50% + ${totalX}px)`,
        top: `calc(52% + ${totalY}px)`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(0.95)`,
        zIndex: zIndex + (crossIndex * 10),
      };
    }

    case 'grid': {
      // Map standard index to a multi-column responsive flexible bento grid positioning
      // Calculate columns dynamically based on total card count.
      // E.g., if we have <= 3, lay them out in 1 row. If 4 to 8, in 4 cols. If 9+, in 5 cols.
      const cols = total <= 3 ? total : total <= 8 ? 4 : 5;
      const col = index % cols;
      const row = Math.floor(index / cols);

      // Compact margins to fit within the viewport comfortably
      const cellW = total <= 4 ? 16 : 14; // vw width bounds
      const cellH = total <= 4 ? 25 : 23; // vh height bounds

      // Centered offset map
      const startX = -((cols - 1) * cellW) / 2;
      const startY = -((Math.ceil(total / cols) - 1) * cellH) / 2;

      const posX = startX + col * cellW;
      const posY = startY + row * cellH;

      // Elegant tiny tilt for scrapbook organic collage feel
      const tilt = (index % 3 - 1) * 3;

      return {
        left: `calc(50% + ${posX}vw)`,
        top: `calc(44% + ${posY}vh)`,
        transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(0.85)`,
        zIndex: 20,
      };
    }

    case 'scatter':
    default: {
      // Floating organic state.
      // We seed deterministic chaotic patterns based on the index to keep positions stable
      const seedVal = index * 133.7;
      const waveX = Math.sin(seedVal) * 32; // bounds
      const waveY = Math.cos(seedVal) * 30;

      const skew = Math.sin(seedVal * 1.5) * 15; // natural angle

      return {
        left: `calc(50% + ${waveX}vw)`,
        top: `calc(55% + ${waveY}vh)`,
        transform: `translate(-50%, -50%) rotate(${skew}deg) scale(0.9)`,
        zIndex: 15,
      };
    }
  }
}
