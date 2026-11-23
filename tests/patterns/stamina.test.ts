import { beforeEach, describe, expect, it } from 'vitest';
import { Battle } from '../../src/battle/Battle';
import { BattleLog } from '../../src/battle/BattleLog';
import { config } from '../../src/config';
import { ITEMS } from '../../src/content/items';
import { SHOP_CATEGORIES, shopEntries } from '../../src/content/shop';
import { GameState } from '../../src/core/GameState';
import { UseItemCommand } from '../../src/patterns/command/UseItemCommand';
import { UseMoveCommand } from '../../src/patterns/command/UseMoveCommand';
import { Duck } from '../../src/patterns/decorator/Duck';
import { HatOutfit } from '../../src/patterns/decorator/HatOutfit';
import { WildDuck } from '../../src/patterns/factory/WildDuck';
import { Peck } from '../../src/patterns/strategy/Peck';
import { Quack } from '../../src/patterns/strategy/Quack';

describe('Stamina', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('the duck starts full, spends and restores stamina, and cannot overspend', () => {
    const duck = new Duck();
    expect(duck.getStamina()).toBe(config.duck.maxStamina);
    expect(duck.spendStamina(4)).toBe(true);
    expect(duck.getStamina()).toBe(6);
    expect(duck.spendStamina(7)).toBe(false);
    expect(duck.getStamina()).toBe(6); // nothing was spent
    duck.restoreStamina(99);
    expect(duck.getStamina()).toBe(config.duck.maxStamina);
  });

  it('outfits share the one stamina of the duck underneath', () => {
    const duck = new Duck();
    const dressed = new HatOutfit(new HatOutfit(duck));
    dressed.spendStamina(3);
    expect(duck.getStamina()).toBe(config.duck.maxStamina - 3);
    expect(dressed.getStamina()).toBe(duck.getStamina());
    expect(dressed.getMaxStamina()).toBe(config.duck.maxStamina);
  });

  it('a stronger move costs more: Peck costs more than Quack', () => {
    expect(new Peck().staminaCost).toBeGreaterThan(new Quack().staminaCost);
  });

  it('a move spends its cost; a tired actor skips the move and says so', () => {
    const duck = new Duck();
    const foe = new Duck();
    const log = new BattleLog();
    new UseMoveCommand(duck, foe, new Peck()).execute(log);
    expect(duck.getStamina()).toBe(config.duck.maxStamina - config.staminaCost.peck);
    duck.spendStamina(duck.getStamina()); // exhausted
    const hp = foe.getHp();
    new UseMoveCommand(duck, foe, new Peck()).execute(log);
    expect(foe.getHp()).toBe(hp);
    expect(log.getLines().at(-1)).toContain('too tired');
  });

  it('the duck cannot Peck every turn: stamina runs out, Quack keeps going', () => {
    const duck = new Duck(999);
    const enemy = new WildDuck();
    enemy.takeDamage(-0); // untouched
    const battle = new Battle(duck, enemy);
    enemy.ai = { chooseCommand: () => ({ actor: enemy, priority: 0, execute: () => undefined }) };
    let pecks = 0;
    for (let turn = 0; turn < 8; turn++) {
      const before = duck.getStamina();
      if (before >= config.staminaCost.peck) {
        battle.submit(new UseMoveCommand(duck, enemy, new Peck()));
        pecks += 1;
      } else {
        battle.submit(new UseMoveCommand(duck, enemy, new Quack()));
      }
      battle.playTurn();
      if (battle.isOver()) break;
    }
    expect(pecks).toBeLessThan(8);
    expect(pecks).toBeGreaterThan(0);
  });

  it('every turn gives a little stamina back, and a new fight starts with full stamina', () => {
    const duck = new Duck(999);
    duck.spendStamina(duck.getStamina());
    const enemy = new WildDuck();
    enemy.ai = { chooseCommand: () => ({ actor: enemy, priority: 0, execute: () => undefined }) };
    const battle = new Battle(duck, enemy);
    expect(duck.getStamina()).toBe(config.duck.maxStamina); // refilled at the start
    battle.submit(new UseMoveCommand(duck, enemy, new Peck()));
    battle.playTurn();
    expect(duck.getStamina()).toBe(config.duck.maxStamina - config.staminaCost.peck + config.staminaRegen);
    expect(battle.hpSnapshot().playerStamina).toBe(duck.getStamina());
  });

  it('beings never run out of stamina', () => {
    const being = new WildDuck();
    expect(being.spendStamina()).toBe(true);
    expect(being.getStamina()).toBe(being.getMaxStamina());
  });

  it('stamina food restores stamina in battle and is used up', () => {
    const state = GameState.getInstance();
    state.addItem('corn');
    const duck = state.getDuck();
    duck.spendStamina(duck.getMaxStamina());
    const log = new BattleLog();
    new UseItemCommand(duck, duck, ITEMS.corn).execute(log);
    expect(duck.getStamina()).toBe(config.stamina.corn);
    expect(state.countOf('corn')).toBe(0);
    expect(log.getLines()[0]).toContain('stamina');
  });

  it('the barn shop sells stamina food, and the top bar can read the HP', () => {
    const food = shopEntries('consumable').map((e) => e.id);
    expect(food).toContain('corn');
    expect(food).toContain('seed_cake');
    expect(SHOP_CATEGORIES).toContain('consumable');
    const state = GameState.getInstance();
    expect(state.getDuckHp()).toEqual({ hp: config.duck.maxHp, maxHp: config.duck.maxHp });
    state.getDuck().takeDamage(7);
    expect(state.getDuckHp().hp).toBe(config.duck.maxHp - 7);
  });
});
