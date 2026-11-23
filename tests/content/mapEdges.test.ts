import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST } from '../../src/assets/AssetManifest';
import { config } from '../../src/config';
import { EDGE_MARGIN, TOP_EDGE_Y, arrivalPoint, reachedEdge } from '../../src/content/mapEdges';

const W = config.gameWidth;
const H = config.gameHeight;

describe('Map changes at the screen edges (Stardew style)', () => {
  it('leaves through an edge only when standing at it and still pushing toward it', () => {
    expect(reachedEdge('right', W - EDGE_MARGIN, 300, 120, 0)).toBe(true);
    expect(reachedEdge('right', W - EDGE_MARGIN, 300, 0, 0)).toBe(false);
    expect(reachedEdge('right', W - EDGE_MARGIN, 300, -120, 0)).toBe(false);
    expect(reachedEdge('left', EDGE_MARGIN, 300, -120, 0)).toBe(true);
    expect(reachedEdge('left', EDGE_MARGIN, 300, 120, 0)).toBe(false);
    expect(reachedEdge('bottom', 400, H - EDGE_MARGIN, 0, 120)).toBe(true);
    expect(reachedEdge('bottom', 400, H - EDGE_MARGIN, 0, -120)).toBe(false);
    expect(reachedEdge('bottom', 400, H / 2, 0, 120)).toBe(false);
    expect(reachedEdge('top', 400, TOP_EDGE_Y, 0, -120)).toBe(true);
    expect(reachedEdge('top', 400, TOP_EDGE_Y, 0, 120)).toBe(false);
    expect(reachedEdge('top', 400, 300, 0, -120)).toBe(false);
  });

  it('the duck arrives just inside the opposite edge, so it does not leave again at once', () => {
    const fromBottom = arrivalPoint('bottom', { x: 420, y: 500 });
    expect(reachedEdge('top', fromBottom.x, fromBottom.y, 0, -120)).toBe(false);
    const fromTop = arrivalPoint('top', { x: 420, y: 52 });
    expect(reachedEdge('bottom', fromTop.x, fromTop.y, 0, 120)).toBe(false);
    const fromRight = arrivalPoint('right', { x: 900, y: 300 });
    expect(reachedEdge('left', fromRight.x, fromRight.y, -120, 0)).toBe(false);
    const fromLeft = arrivalPoint('left', { x: 30, y: 300 });
    expect(reachedEdge('right', fromLeft.x, fromLeft.y, 120, 0)).toBe(false);
  });

  it('keeps the place along the edge, but inside the allowed part of the next map', () => {
    expect(arrivalPoint('right', { x: 900, y: 300 }, { minY: 150, maxY: 500 }).y).toBe(300);
    expect(arrivalPoint('right', { x: 900, y: 100 }, { minY: 150, maxY: 500 }).y).toBe(150);
    expect(arrivalPoint('left', { x: 30, y: 900 }, { minY: 150, maxY: 500 }).y).toBe(500);
    // leaving the farm at the bottom: arrive on the pier (x 390 to 450), however far to the side the duck was
    expect(arrivalPoint('bottom', { x: 100, y: 520 }, { minX: 390, maxX: 450 }).x).toBe(390);
    expect(arrivalPoint('bottom', { x: 420, y: 520 }, { minX: 390, maxX: 450 }).x).toBe(420);
    expect(arrivalPoint('top', { x: 900, y: 52 }, { minX: 390, maxX: 450 }).x).toBe(450);
  });

  it('only buildings have doors; the pond is reached by the pier and the forest through the opening in the trees', () => {
    expect([...ASSET_MANIFEST.entrance].sort()).toEqual(['box_exit', 'edge_forest', 'edge_pond', 'to_house', 'to_shop']);
  });
});
