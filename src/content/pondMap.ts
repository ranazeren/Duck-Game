import type { Rng } from '../core/Rng';
import mask from './pondMask.json';

/**
 * Plain rules (no Phaser): where the water is on the pond map. The layout is written by tools/generate-assets.mjs
 * together with the picture, so what looks like water is water. One cell is `cell` pixels:
 * L land, B bricks, P pier, W water.
 */
export type PondCell = 'L' | 'B' | 'P' | 'W';

/** The dense bed of reeds (an ellipse, in pixels) where the Reed Warden stands. Written by the generator with the picture. */
export const REED_BED: { x: number; y: number; rx: number; ry: number } = mask.reedBed;

export const POND_CELL = mask.cell;
export const POND_COLS = mask.cols;
export const POND_ROWS = mask.rows.length;

export function pondCellAt(x: number, y: number): PondCell {
  const col = Math.floor(x / POND_CELL);
  const row = Math.floor(y / POND_CELL);
  if (col < 0 || col >= POND_COLS || row < 0) return 'L';
  if (row >= POND_ROWS) return 'W';
  return mask.rows[row][col] as PondCell;
}

/** True where a swimmer's waterline is in water (pass the point at the feet). */
export function isPondWater(x: number, y: number): boolean {
  return pondCellAt(x, y) === 'W';
}

/** A random point in the water, at least `margin` pixels from any land (so a swimmer never touches the bank). */
export function randomWaterPoint(rng: Rng, margin = 28): { x: number; y: number } | null {
  const width = POND_COLS * POND_CELL;
  const height = POND_ROWS * POND_CELL;
  for (let tries = 0; tries < 200; tries++) {
    const x = margin + rng() * (width - 2 * margin);
    const y = margin + rng() * (height - 2 * margin);
    if (isOpenWater(x, y, margin)) return { x, y };
  }
  return null;
}

/** Water all around the point, out to `margin` pixels. */
export function isOpenWater(x: number, y: number, margin = 28): boolean {
  for (const [dx, dy] of [[0, 0], [margin, 0], [-margin, 0], [0, margin], [0, -margin], [margin, margin], [-margin, -margin], [margin, -margin], [-margin, margin]]) {
    if (!isPondWater(x + dx, y + dy)) return false;
  }
  return true;
}
