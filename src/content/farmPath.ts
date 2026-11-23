import path from './farmPath.json';

/**
 * Plain rules (no Phaser): the dirt paths on the farm map: the main path from the house door down to the pier, and a branch
 * from it to the opening of the forest on the right. The waypoints are written next to the picture by
 * tools/generate-assets.mjs, so decorations can be kept off the paths.
 */
export const FARM_PATH_POINTS: ReadonlyArray<readonly [number, number]> = path.points as Array<[number, number]>;
/** The branch to the forest. */
export const FARM_FOREST_POINTS: ReadonlyArray<readonly [number, number]> = path.forestPoints as Array<[number, number]>;
export const FARM_PATH_HALF_WIDTH: number = path.halfWidth;

/** A path as a smooth curve (Catmull-Rom through the waypoints). */
function curve(points: ReadonlyArray<readonly [number, number]>, perSegment = 12): Array<[number, number]> {
  const p = [points[0], ...points, points[points.length - 1]];
  const out: Array<[number, number]> = [];
  for (let i = 1; i < p.length - 2; i++) {
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number): number =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p[i - 1][0], p[i][0], p[i + 1][0], p[i + 2][0]), f(p[i - 1][1], p[i][1], p[i + 1][1], p[i + 2][1])]);
    }
  }
  out.push([points[points.length - 1][0], points[points.length - 1][1]]);
  return out;
}

const MAIN_SAMPLES = curve(FARM_PATH_POINTS);
const FOREST_SAMPLES = curve(FARM_FOREST_POINTS);
const SAMPLES = [...MAIN_SAMPLES, ...FOREST_SAMPLES];

function nearest(samples: Array<[number, number]>, x: number, y: number): number {
  let best = Infinity;
  for (const [sx, sy] of samples) best = Math.min(best, Math.hypot(x - sx, y - sy));
  return best;
}

/** How far (in pixels) a point is from the middle line of the nearest path. */
export function distanceToPath(x: number, y: number): number {
  return nearest(SAMPLES, x, y);
}

/** How far a point is from the branch to the forest. */
export function distanceToForestPath(x: number, y: number): number {
  return nearest(FOREST_SAMPLES, x, y);
}

/** True when a point is on a path. */
export function onPath(x: number, y: number): boolean {
  return distanceToPath(x, y) <= FARM_PATH_HALF_WIDTH;
}
