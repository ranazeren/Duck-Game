import type { Rng } from '../core/Rng';

/** Little things scattered over the grass here and there: a small tree, a bush, flowers. Purely decorative. */
export type DecorId = 'tree_small' | 'bush' | 'flower_white' | 'flower_blue';

export interface DecorSpot {
  id: DecorId;
  x: number;
  y: number;
}

/** A rectangle to keep free (paths, doors, animals, spawn points). */
export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScatterOptions {
  count: number;
  area: { minX: number; maxX: number; minY: number; maxY: number };
  avoid: Zone[];
  /** Extra check for a point (for example: only on land). */
  isOk?: (x: number, y: number) => boolean;
  /** Nearest allowed distance between two things. */
  minGap?: number;
  maxTrees?: number;
}

/** Picks a kind: flowers are common, trees are rare. */
function pickId(rng: Rng, trees: number, maxTrees: number): DecorId {
  const r = rng();
  if (r < 0.1 && trees < maxTrees) return 'tree_small';
  if (r < 0.3) return 'bush';
  return r < 0.68 ? 'flower_white' : 'flower_blue';
}

function inside(zone: Zone, x: number, y: number, margin = 0): boolean {
  return x >= zone.x - margin && x <= zone.x + zone.w + margin && y >= zone.y - margin && y <= zone.y + zone.h + margin;
}

/** Scatters decorations deterministically (give a seeded Rng): the same places every time the map is shown. */
export function scatterDecor(rng: Rng, options: ScatterOptions): DecorSpot[] {
  const { count, area, avoid, isOk, minGap = 46, maxTrees = 3 } = options;
  const spots: DecorSpot[] = [];
  let trees = 0;
  for (let tries = 0; tries < count * 60 && spots.length < count; tries++) {
    const x = area.minX + rng() * (area.maxX - area.minX);
    const y = area.minY + rng() * (area.maxY - area.minY);
    if (avoid.some((zone) => inside(zone, x, y, 26))) continue;
    if (isOk && !isOk(x, y)) continue;
    if (spots.some((spot) => Math.hypot(spot.x - x, spot.y - y) < minGap)) continue;
    const id = pickId(rng, trees, maxTrees);
    if (id === 'tree_small') trees += 1;
    spots.push({ id, x: Math.round(x), y: Math.round(y) });
  }
  return spots;
}
