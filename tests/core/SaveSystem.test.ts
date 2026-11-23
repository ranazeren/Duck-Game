import { describe, expect, it } from 'vitest';
import { GameState } from '../../src/core/GameState';
import { createRng } from '../../src/core/Rng';
import { SAVE_KEY, SaveSystem } from '../../src/core/SaveSystem';
import { MemoryStorage } from '../helpers';

describe('SaveSystem', () => {
  it('returns null when nothing was saved', () => {
    expect(new SaveSystem(new MemoryStorage()).load()).toBeNull();
    expect(new SaveSystem(null).load()).toBeNull();
  });

  it('ignores a corrupt save and never throws', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage);
    for (const raw of ['{not json', '42', '{"version":99}', '{"version":1,"coins":"many"}']) {
      storage.setItem(SAVE_KEY, raw);
      expect(system.load()).toBeNull();
    }
  });

  it('survives a storage that throws', () => {
    const broken = {
      getItem(): string | null {
        throw new Error('denied');
      },
      setItem(): void {
        throw new Error('full');
      },
    };
    const system = new SaveSystem(broken);
    expect(system.load()).toBeNull();
    expect(() => system.save({ version: 1, coins: 0, inventory: {}, equipped: [], placed: {}, unlocked: [], minutesOfDay: 0, phase: 'night', duckHp: 1 })).not.toThrow();
  });
});

describe('GameState.save and load', () => {
  it('restores coins, items, outfits, house, clock, phase and duck HP', () => {
    const storage = new MemoryStorage();
    const before = GameState.resetForTests(storage);
    before.addCoins(12);
    before.addItem('bread');
    before.unlock('chair');
    before.unlock('table');
    before.setPlaced('c2r1', 'chair');
    before.setEquipped(['sweater', 'hat']);
    before.advanceTime(11 * 60);
    before.getDuck().takeDamage(7);
    before.save();

    const after = GameState.resetForTests(storage);
    expect(after.load()).toBe(true);
    expect(after.getCoins()).toBe(12);
    expect(after.countOf('bread')).toBe(1);
    expect(after.getUnlocked().slice().sort()).toEqual(['chair', 'table']);
    expect(after.getPlaced('c2r1')).toBe('chair');
    expect(after.getEquipped()).toEqual(['sweater', 'hat']);
    expect(after.getPhase()).toBe('night');
    expect(after.getMinutesOfDay()).toBe(before.getMinutesOfDay());
    expect(after.getDuck().getHp()).toBe(13);
  });

  it('starts a new game when the save is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '<<<garbage>>>');
    const state = GameState.resetForTests(storage);
    expect(state.load()).toBe(false);
    expect(state.getCoins()).toBe(0);
    expect(state.countOf('berry')).toBe(2);
  });
});

describe('Rng', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = createRng(7);
    const b = createRng(7);
    for (let i = 0; i < 100; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
