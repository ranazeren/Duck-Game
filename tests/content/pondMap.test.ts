import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST } from '../../src/assets/AssetManifest';
import { config } from '../../src/config';
import { arrivalPoint } from '../../src/content/mapEdges';
import { POND_CELL, POND_COLS, POND_ROWS, isOpenWater, isPondWater, pondCellAt, randomWaterPoint } from '../../src/content/pondMap';
import { createRng } from '../../src/core/Rng';

describe('Pond map (the mask written next to the picture)', () => {
  it('covers the whole screen', () => {
    expect(POND_COLS * POND_CELL).toBe(config.gameWidth);
    expect(POND_ROWS * POND_CELL).toBe(config.gameHeight);
  });

  it('has land on top and a lot of water below', () => {
    expect(pondCellAt(100, 20)).toBe('L');
    expect(pondCellAt(200, 60)).toBe('L');
    expect(isPondWater(700, 450)).toBe(true);
    expect(isPondWater(100, 500)).toBe(true);
    let water = 0;
    for (let y = 0; y < config.gameHeight; y += POND_CELL) for (let x = 0; x < config.gameWidth; x += POND_CELL) if (isPondWater(x, y)) water += 1;
    expect(water / (POND_COLS * POND_ROWS)).toBeGreaterThan(0.35);
  });

  it('the pier runs in from the top of the screen down into the water, and is not water itself', () => {
    const x = 32 * POND_CELL + 2 * POND_CELL;
    for (let row = 0; row <= 29; row++) expect(pondCellAt(x, row * POND_CELL + 1)).toBe('P');
    expect(isPondWater(x, 31 * POND_CELL)).toBe(true);
    expect(isPondWater(x - 3 * POND_CELL * 4, 20 * POND_CELL)).toBe(true); // water beside the pier
  });

  it('there is no stone road at all, and the pier is narrow (60 px)', () => {
    for (let row = 0; row < POND_ROWS; row++) {
      for (let col = 0; col < POND_COLS; col++) expect(pondCellAt(col * POND_CELL, row * POND_CELL)).not.toBe('B');
    }
    let pierCells = 0;
    for (let col = 0; col < POND_COLS; col++) if (pondCellAt(col * POND_CELL + 1, 100) === 'P') pierCells += 1;
    expect(pierCells * POND_CELL).toBe(60);
  });

  it('the duck arrives from the farm on the pier, and from the pond at the same x as the pier on the farm', () => {
    for (const fromX of [100, 380, 420, 700]) {
      const at = arrivalPoint('bottom', { x: fromX, y: 520 }, { minX: 400, maxX: 428 });
      expect(pondCellAt(at.x, at.y)).toBe('P');
    }
    // the pier on the pond map spans the same x as the pier picture at the bottom of the farm (384 to 444)
    expect(pondCellAt(384, 100)).toBe('P');
    expect(pondCellAt(443, 100)).toBe('P');
    expect(pondCellAt(383, 100)).not.toBe('P');
    expect(pondCellAt(444, 100)).not.toBe('P');
  });

  it('a frog can always find open water, away from the banks', () => {
    const rng = createRng(5);
    for (let i = 0; i < 30; i++) {
      const point = randomWaterPoint(rng)!;
      expect(point).not.toBeNull();
      expect(isOpenWater(point.x, point.y)).toBe(true);
    }
  });

  it('the frog and the new pond pictures are in the manifest', () => {
    expect(ASSET_MANIFEST.animal).toContain('frog');
    expect(ASSET_MANIFEST.background).toContain('pond');
    expect(ASSET_MANIFEST.background).toContain('pond_night');
  });
});
