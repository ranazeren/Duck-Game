import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST } from '../../src/assets/AssetManifest';
import { FARM_FOREST_POINTS, FARM_PATH_HALF_WIDTH, FARM_PATH_POINTS, distanceToForestPath, distanceToPath, onPath } from '../../src/content/farmPath';
import { FOREST_ARRIVAL, FOREST_GAP, FOREST_TRAIL } from '../../src/content/forestMap';
import { scatterDecor } from '../../src/content/decor';
import { createRng } from '../../src/core/Rng';

describe('The dirt path from the house to the pier', () => {
  it('starts at the house door and ends at the pier (x 384 to 444)', () => {
    const first = FARM_PATH_POINTS[0];
    const last = FARM_PATH_POINTS[FARM_PATH_POINTS.length - 1];
    expect(first[0]).toBeGreaterThan(190);
    expect(first[0]).toBeLessThan(250);
    expect(last[0]).toBeGreaterThanOrEqual(384);
    expect(last[0]).toBeLessThanOrEqual(444);
    expect(last[1]).toBeGreaterThan(500);
  });

  it('winds: it runs both down and to the right', () => {
    const first = FARM_PATH_POINTS[0];
    const last = FARM_PATH_POINTS[FARM_PATH_POINTS.length - 1];
    expect(last[1]).toBeGreaterThan(first[1] + 200);
    expect(last[0]).toBeGreaterThan(first[0] + 100);
  });

  it('knows what is on it and how far from it a point is', () => {
    const [x, y] = FARM_PATH_POINTS[3];
    expect(onPath(x, y)).toBe(true);
    expect(distanceToPath(x, y)).toBeLessThan(2);
    expect(onPath(x + 200, y - 150)).toBe(false);
    expect(distanceToPath(900, 150)).toBeGreaterThan(FARM_PATH_HALF_WIDTH);
  });

  it('decorations scattered off the path never stand on it', () => {
    const spots = scatterDecor(createRng(21), {
      count: 40,
      area: { minX: 30, maxX: 930, minY: 160, maxY: 470 },
      avoid: [],
      isOk: (x, y) => distanceToPath(x, y) > FARM_PATH_HALF_WIDTH + 36,
    });
    expect(spots.length).toBeGreaterThan(10);
    for (const spot of spots) expect(onPath(spot.x, spot.y)).toBe(false);
  });

  it('has a branch to the forest: it leaves the main path and ends in the opening on the right edge', () => {
    const start = FARM_FOREST_POINTS[0];
    const end = FARM_FOREST_POINTS[FARM_FOREST_POINTS.length - 1];
    expect(distanceToPath(start[0], start[1])).toBeLessThan(2); // it starts on the main path
    expect(end[0]).toBeGreaterThanOrEqual(960);
    expect(end[1]).toBeGreaterThan(FOREST_GAP.minY);
    expect(end[1]).toBeLessThan(FOREST_GAP.maxY);
    expect(end[1]).toBeGreaterThanOrEqual(FOREST_ARRIVAL.minY);
    expect(end[1]).toBeLessThanOrEqual(FOREST_ARRIVAL.maxY);
    expect(end[0] - start[0]).toBeGreaterThan(500); // it really crosses the farm
  });

  it('runs straight into the opening, level with the trail on the forest side (no step or jump where the maps meet)', () => {
    const last = FARM_FOREST_POINTS.slice(-3);
    for (const [, y] of last) expect(Math.abs(y - last[last.length - 1][1])).toBeLessThanOrEqual(2);
    expect(Math.abs(last[last.length - 1][1] - FOREST_TRAIL.points[0][1])).toBeLessThanOrEqual(2);
    expect(FOREST_TRAIL.halfWidth).toBe(FARM_PATH_HALF_WIDTH); // the same width on both sides
  });

  it('knows the branch too', () => {
    const mid = FARM_FOREST_POINTS[3];
    expect(onPath(mid[0], mid[1])).toBe(true);
    expect(distanceToForestPath(mid[0], mid[1])).toBeLessThan(2);
    expect(distanceToForestPath(100, 100)).toBeGreaterThan(FARM_PATH_HALF_WIDTH);
  });

  it('has its picture in the manifest', () => {
    expect(ASSET_MANIFEST.ground).toContain('farm_path');
  });
});
