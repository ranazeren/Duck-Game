import { beforeEach, describe, expect, it } from 'vitest';
import { Battle } from '../../src/battle/Battle';
import { config } from '../../src/config';
import { BLOCKED, cellCenter, cellId, parseCell } from '../../src/content/houseGrid';
import { ITEMS } from '../../src/content/items';
import { joinPlaced, splitPlaced } from '../../src/content/placement';
import { SHOP_CATEGORIES, buy, isOwned, shopEntries } from '../../src/content/shop';
import { GameState } from '../../src/core/GameState';
import { Duck } from '../../src/patterns/decorator/Duck';
import { Peck } from '../../src/patterns/strategy/Peck';
import { WildDuck } from '../../src/patterns/factory/WildDuck';
import { UseMoveCommand } from '../../src/patterns/command/UseMoveCommand';

describe('Barn shop', () => {
  let state: GameState;

  beforeEach(() => {
    state = GameState.resetForTests();
  });

  it('sells outfits, furniture and food, all of them known items with a price', () => {
    for (const category of SHOP_CATEGORIES) {
      const entries = shopEntries(category);
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(ITEMS[entry.id]).toBeDefined();
        expect(entry.price).toBeGreaterThan(0);
      }
    }
    expect(shopEntries('furniture').map((e) => e.id)).toContain('disco_ball');
  });

  it('a purchase takes the price and gives the item', () => {
    state.addCoins(100);
    const hat = shopEntries('outfit').find((e) => e.id === 'hat')!;
    expect(buy(hat)).toBe('bought');
    expect(state.getCoins()).toBe(100 - hat.price);
    expect(state.countOf('hat')).toBe(1);
  });

  it('furniture is unlocked, not counted, and cannot be bought twice', () => {
    state.addCoins(200);
    const lamp = shopEntries('furniture').find((e) => e.id === 'lamp')!;
    expect(buy(lamp)).toBe('bought');
    expect(state.isUnlocked('lamp')).toBe(true);
    expect(state.countOf('lamp')).toBe(0);
    expect(isOwned(lamp)).toBe(true);
    const coins = state.getCoins();
    expect(buy(lamp)).toBe('owned');
    expect(state.getCoins()).toBe(coins);
  });

  it('outfits are bought once, food again and again', () => {
    state.addCoins(200);
    const hat = shopEntries('outfit')[0];
    expect(buy(hat)).toBe('bought');
    expect(buy(hat)).toBe('owned');
    const berry = shopEntries('consumable').find((e) => e.id === 'berry')!;
    const before = state.countOf('berry');
    expect(buy(berry)).toBe('bought');
    expect(buy(berry)).toBe('bought');
    expect(state.countOf('berry')).toBe(before + 2);
  });

  it('too few coins: nothing is bought and nothing is taken', () => {
    state.addCoins(3);
    const rapper = shopEntries('outfit').find((e) => e.id === 'rapper')!;
    expect(buy(rapper)).toBe('poor');
    expect(state.getCoins()).toBe(3);
    expect(state.countOf('rapper')).toBe(0);
  });

  it('a new game starts with some coins, no outfits and no furniture', () => {
    expect(config.startingCoins).toBeGreaterThan(0);
    expect(Object.keys(config.startingInventory)).toEqual(['berry']);
  });
});

describe('Losing a fight', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  function loseFight(): Battle {
    const enemy = new WildDuck();
    enemy.ai = { chooseCommand: (self, player) => new UseMoveCommand(self, player, new Peck()) };
    const duck = new Duck(5);
    const battle = new Battle(duck, enemy);
    duck.takeDamage(4);
    battle.submit({ actor: duck, priority: 0, execute: () => undefined });
    battle.playTurn();
    return battle;
  }

  it('costs a quarter of the coins', () => {
    const state = GameState.getInstance();
    state.addCoins(60);
    expect(loseFight().getResult()).toBe('lose');
    expect(state.getCoins()).toBe(60 - 15);
  });

  it('costs nothing when there are no coins', () => {
    const state = GameState.getInstance();
    expect(loseFight().getResult()).toBe('lose');
    expect(state.getCoins()).toBe(0);
  });
});

describe('Placed items and rotation', () => {
  it('stores a quarter-turn count in the placed string and reads it back', () => {
    expect(joinPlaced('chair', 0)).toBe('chair');
    expect(joinPlaced('chair', 1)).toBe('chair@1');
    expect(joinPlaced('chair', 5)).toBe('chair@1');
    expect(splitPlaced('chair')).toEqual({ id: 'chair', rot: 0 });
    expect(splitPlaced('lamp@3')).toEqual({ id: 'lamp', rot: 3 });
    expect(splitPlaced('lamp@x')).toEqual({ id: 'lamp', rot: 0 });
  });

  it('four turns come back to the start', () => {
    let value = 'rug';
    for (let i = 0; i < 4; i++) {
      const { id, rot } = splitPlaced(value);
      value = joinPlaced(id, rot + 1);
    }
    expect(value).toBe('rug');
  });

  it('a rotated item still unlocks its furniture when an old save is loaded', () => {
    const storage = new Map<string, string>();
    const fake = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v) };
    const before = GameState.resetForTests(fake);
    before.setPlaced('c1r1', 'disco_ball@2');
    before.save();
    const after = GameState.resetForTests(fake);
    after.load();
    expect(after.isUnlocked('disco_ball')).toBe(true);
    expect(after.getPlaced('c1r1')).toBe('disco_ball@2');
  });

  it('the house grid knows its cells and keeps the way to the exit free', () => {
    expect(parseCell(cellId(2, 3))).toEqual({ col: 2, row: 3 });
    expect(parseCell('floor')).toBeNull();
    expect(parseCell(cellId(config.houseGrid.cols, 0))).toBeNull();
    expect(cellCenter(0, 0).x).toBe(config.houseGrid.cell / 2);
    expect(BLOCKED.size).toBe(2);
  });
});
