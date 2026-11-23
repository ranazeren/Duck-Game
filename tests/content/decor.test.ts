import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST } from '../../src/assets/AssetManifest';
import { scatterDecor, type Zone } from '../../src/content/decor';
import { FARM_ANIMALS } from '../../src/content/farmAnimals';
import { pondCellAt } from '../../src/content/pondMap';
import { createRng } from '../../src/core/Rng';

const area = { minX: 30, maxX: 930, minY: 160, maxY: 470 };
const avoid: Zone[] = [
  { x: 150, y: 110, w: 150, h: 130 },
  { x: 640, y: 110, w: 150, h: 130 },
  ...FARM_ANIMALS.map((a) => ({ x: a.x - 80, y: a.y - 70, w: 160, h: 140 })),
];

describe('Grass decorations', () => {
  it('are the same every time for the same seed (the map does not change when you come back)', () => {
    const a = scatterDecor(createRng(21), { count: 16, area, avoid });
    const b = scatterDecor(createRng(21), { count: 16, area, avoid });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it('stay out of the zones that must stay free and keep their distance from each other', () => {
    const spots = scatterDecor(createRng(21), { count: 16, area, avoid });
    for (const spot of spots) {
      for (const zone of avoid) {
        const inside = spot.x >= zone.x && spot.x <= zone.x + zone.w && spot.y >= zone.y && spot.y <= zone.y + zone.h;
        expect(inside).toBe(false);
      }
      expect(spot.x).toBeGreaterThanOrEqual(area.minX);
      expect(spot.y).toBeLessThanOrEqual(area.maxY);
    }
    for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y)).toBeGreaterThanOrEqual(46);
  });

  it('trees are rare, and every kind has a picture', () => {
    const spots = scatterDecor(createRng(9), { count: 30, area, avoid: [] });
    expect(spots.filter((s) => s.id === 'tree_small').length).toBeLessThanOrEqual(3);
    for (const spot of spots) expect(ASSET_MANIFEST.decor).toContain(spot.id);
    const kinds = new Set(scatterDecor(createRng(2), { count: 60, area, avoid: [] }).map((s) => s.id));
    expect(kinds.size).toBe(4);
    expect(ASSET_MANIFEST.decor).not.toContain('tall_grass');
  });

  it('on the pond map they stand only on dry land, well away from the water and the pier', () => {
    const spots = scatterDecor(createRng(34), {
      count: 10,
      area: { minX: 30, maxX: 930, minY: 70, maxY: 300 },
      avoid: [{ x: 350, y: 30, w: 130, h: 330 }],
      isOk: (x, y) => pondCellAt(x, y) === 'L' && pondCellAt(x - 20, y + 16) === 'L' && pondCellAt(x + 20, y + 16) === 'L' && pondCellAt(x, y + 28) === 'L',
    });
    expect(spots.length).toBeGreaterThan(4);
    for (const spot of spots) {
      expect(pondCellAt(spot.x, spot.y)).toBe('L');
      expect(pondCellAt(spot.x, spot.y + 28)).toBe('L');
    }
  });
});
