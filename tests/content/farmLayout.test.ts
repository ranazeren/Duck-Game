import { describe, expect, it } from 'vitest';
import { DUCK_SIZE, FARM_HOUSE, FARM_SHOP, HOUSE_SIZE, RETURN_FROM_HOUSE, RETURN_FROM_SHOP, SHOP_SIZE, overlaps } from '../../src/content/farmLayout';

describe('Coming back out of a building', () => {
  it('the duck appears outside the door, not inside it (or it would be sent straight back in)', () => {
    expect(overlaps(RETURN_FROM_SHOP, DUCK_SIZE, FARM_SHOP, SHOP_SIZE)).toBe(false);
    expect(overlaps(RETURN_FROM_HOUSE, DUCK_SIZE, FARM_HOUSE, HOUSE_SIZE)).toBe(false);
  });

  it('and not inside the other building either', () => {
    expect(overlaps(RETURN_FROM_SHOP, DUCK_SIZE, FARM_HOUSE, HOUSE_SIZE)).toBe(false);
    expect(overlaps(RETURN_FROM_HOUSE, DUCK_SIZE, FARM_SHOP, SHOP_SIZE)).toBe(false);
  });

  it('the old shop spawn point was inside the (bigger) shop door: that was the bug', () => {
    expect(overlaps({ x: 712, y: 215 }, DUCK_SIZE, FARM_SHOP, SHOP_SIZE)).toBe(true);
  });

  it('the two buildings do not overlap each other', () => {
    expect(overlaps(FARM_HOUSE, HOUSE_SIZE, FARM_SHOP, SHOP_SIZE)).toBe(false);
  });

  it('the overlap check itself works, with squares and with rectangles', () => {
    expect(overlaps({ x: 0, y: 0 }, 10, { x: 5, y: 5 }, 10)).toBe(true);
    expect(overlaps({ x: 0, y: 0 }, 10, { x: 10, y: 0 }, 10)).toBe(false);
    expect(overlaps({ x: 0, y: 0 }, { w: 100, h: 10 }, { x: 60, y: 0 }, { w: 30, h: 10 })).toBe(true);
  });
});
