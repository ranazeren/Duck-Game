/**
 * Plain rules (no Phaser): where the doors of the farm are, how big they are, and where the duck appears when it comes
 * back out of a building. The duck must appear OUTSIDE the door: standing inside the door's area would send it straight back in.
 */
export const DUCK_SIZE = 48;

/** The pictures of the house and the shop (pixels). */
export const HOUSE_SIZE = { w: 100, h: 100 };
export const SHOP_SIZE = { w: 140, h: 110 };

export const FARM_HOUSE = { x: 220, y: 176 };
export const FARM_SHOP = { x: 712, y: 176 };

/** Where the duck stands after leaving the house or the shop: in front of the door, below it. */
export const RETURN_FROM_HOUSE = { x: FARM_HOUSE.x, y: FARM_HOUSE.y + HOUSE_SIZE.h / 2 + DUCK_SIZE / 2 + 28 };
export const RETURN_FROM_SHOP = { x: FARM_SHOP.x, y: FARM_SHOP.y + SHOP_SIZE.h / 2 + DUCK_SIZE / 2 + 28 };

/** True when two rectangles (given by their middles and sizes) overlap. */
export function overlaps(
  a: { x: number; y: number },
  aSize: number | { w: number; h: number },
  b: { x: number; y: number },
  bSize: number | { w: number; h: number },
): boolean {
  const size = (s: number | { w: number; h: number }): { w: number; h: number } => (typeof s === 'number' ? { w: s, h: s } : s);
  const sa = size(aSize);
  const sb = size(bSize);
  return Math.abs(a.x - b.x) < (sa.w + sb.w) / 2 && Math.abs(a.y - b.y) < (sa.h + sb.h) / 2;
}
