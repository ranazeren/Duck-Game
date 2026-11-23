import map from './forestMap.json';

/**
 * Plain rules (no Phaser): the forest map, to the right of the farm. The numbers are written next to the picture by
 * tools/generate-assets.mjs, so what is drawn (the gap, the trail, the Frog King's stump) is where the game puts it.
 */
export const FOREST_BAND: { minY: number; maxY: number } = map.band;
/** The opening between the farm and the forest, along the screen edge. */
export const FOREST_GAP: { minY: number; maxY: number } = map.gap;
export const FOREST_BOSS: { x: number; y: number } = map.boss;
export const FOREST_WAGON: { x: number; y: number } = map.wagon;
export const FOREST_TRAIL: { halfWidth: number; points: ReadonlyArray<readonly [number, number]> } = {
  halfWidth: map.trail.halfWidth,
  points: map.trail.points as Array<[number, number]>,
};

/** Where the duck may arrive when it walks through the gap: the middle part of it. */
export const FOREST_ARRIVAL = { minY: map.gap.minY + 30, maxY: map.gap.maxY - 30 };
