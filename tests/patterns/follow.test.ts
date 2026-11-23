import { beforeEach, describe, expect, it } from 'vitest';
import { config, type BeingId } from '../../src/config';
import { GameState } from '../../src/core/GameState';
import { createRng } from '../../src/core/Rng';
import { DayBeingFactory } from '../../src/patterns/factory/DayBeingFactory';
import { NightBeingFactory } from '../../src/patterns/factory/NightBeingFactory';

describe('Beings that follow the duck (preset chance per being, drawn when it spawns)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('follows or not at random, close to the preset chance of each being', () => {
    const seen = new Map<BeingId, { follow: number; total: number }>();
    for (const factory of [new DayBeingFactory(createRng(21)), new NightBeingFactory(createRng(22))]) {
      for (let i = 0; i < 3000; i++) {
        const being = factory.spawn();
        const entry = seen.get(being.id) ?? { follow: 0, total: 0 };
        entry.total += 1;
        if (being.follows) entry.follow += 1;
        seen.set(being.id, entry);
      }
    }
    expect([...seen.keys()].sort()).toEqual(['ghost', 'robot_duck', 'trash_mob', 'wild_duck']);
    for (const [id, { follow, total }] of seen) {
      expect(Math.abs(follow / total - config.beings[id].followChance)).toBeLessThan(0.06);
    }
  });

  it('some beings follow and some do not, even of the same kind', () => {
    const factory = new DayBeingFactory(createRng(3));
    const wild = Array.from({ length: 200 }, () => factory.spawn()).filter((b) => b.id === 'wild_duck');
    expect(wild.some((b) => b.follows)).toBe(true);
    expect(wild.some((b) => !b.follows)).toBe(true);
  });
});
