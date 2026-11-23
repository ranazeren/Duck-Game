/**
 * The single list of every asset id, per category.
 * Adding a new asset to the game means adding one id here. Nothing else.
 * Artist files live at public/assets/<category>/<id>.png (sounds and music: .ogg).
 */
const manifest = {
  player: ['duck_base'],
  being: ['wild_duck', 'trash_mob', 'ghost', 'robot_duck', 'reed_guardian', 'frog_king'],
  outfit: ['hat', 'sweater', 'rapper', 'cone_hat', 'gloves'],
  item: ['berry', 'bread', 'corn', 'seed_cake', 'chair', 'table', 'lamp', 'rug', 'disco_ball', 'hat', 'sweater', 'rapper', 'cone_hat', 'gloves'],
  decor: ['tree_small', 'bush', 'flower_white', 'flower_blue', 'forest_wagon'],
  animal: ['hen', 'cow', 'owl', 'cat', 'frog', 'squirrel', 'pig'],
  background: ['farm', 'house', 'pond', 'battle', 'forest', 'farm_night', 'pond_night', 'battle_night', 'forest_night'],
  ground: ['grass', 'dirt', 'water', 'floor', 'farm_path'],
  entrance: ['to_house', 'box_exit', 'to_shop', 'edge_pond', 'edge_forest'],
  ui: ['coin', 'piggy', 'heart', 'sun', 'moon', 'inventory', 'settings', 'gear', 'duck_pattern'],
  sfx: ['quack', 'peck', 'hit', 'click'],
  music: ['day_theme', 'night_theme'],
} as const;

export type Category = keyof typeof manifest;

export const ASSET_MANIFEST: Record<Category, readonly string[]> = manifest;

/** Categories that are sounds, not images. */
export type AudioCategory = 'sfx' | 'music';
export type ImageCategory = Exclude<Category, AudioCategory>;

export const IMAGE_CATEGORIES: readonly ImageCategory[] = (Object.keys(manifest) as Category[]).filter(
  (c): c is ImageCategory => c !== 'sfx' && c !== 'music',
);
