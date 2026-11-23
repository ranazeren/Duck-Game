import { config } from '../config';

/**
 * Plain rules (no Phaser): outdoor maps join at their screen edges, like in Stardew Valley.
 * Buildings (the house, the shop) still have doors.
 */
export type EdgeSide = 'left' | 'right' | 'top' | 'bottom';

/** How close to the left, right and bottom screen edge the duck's middle must be. The duck is 48 px wide, so 24 is the wall. */
export const EDGE_MARGIN = 26;

/** The top edge is lower: the duck's middle cannot go higher than the top of the world plus 24 (the maps with a top exit start their world at y 26). */
export const TOP_EDGE_Y = 52;

/** True when the duck stands at the given edge and is still pushing toward it. */
export function reachedEdge(
  side: EdgeSide,
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  width: number = config.gameWidth,
  height: number = config.gameHeight,
): boolean {
  switch (side) {
    case 'right':
      return x >= width - EDGE_MARGIN && velocityX > 0;
    case 'left':
      return x <= EDGE_MARGIN && velocityX < 0;
    case 'bottom':
      return y >= height - EDGE_MARGIN && velocityY > 0;
    case 'top':
      return y <= TOP_EDGE_Y && velocityY < 0;
  }
}

/** The part of the next map the duck may arrive on (for example the pier, or dry land). */
export interface ArrivalLimits {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Where the duck appears on the next map after leaving through `side`: just inside the opposite edge,
 * at the same place along it (kept inside `limits`).
 */
export function arrivalPoint(
  side: EdgeSide,
  from: { x: number; y: number },
  limits: ArrivalLimits = {},
  width: number = config.gameWidth,
  height: number = config.gameHeight,
): { x: number; y: number } {
  switch (side) {
    case 'right':
      return { x: EDGE_MARGIN + 44, y: clamp(from.y, limits.minY, limits.maxY) };
    case 'left':
      return { x: width - EDGE_MARGIN - 44, y: clamp(from.y, limits.minY, limits.maxY) };
    case 'bottom':
      return { x: clamp(from.x, limits.minX, limits.maxX), y: TOP_EDGE_Y + 44 };
    case 'top':
      return { x: clamp(from.x, limits.minX, limits.maxX), y: height - EDGE_MARGIN - 44 };
  }
}
