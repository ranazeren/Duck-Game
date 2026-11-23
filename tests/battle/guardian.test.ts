import { beforeEach, describe, expect, it } from 'vitest';
import { Battle, type BattleResult } from '../../src/battle/Battle';
import { config } from '../../src/config';
import { dialogueFor } from '../../src/content/dialogue';
import { guardianPresent } from '../../src/content/guardian';
import { ITEMS } from '../../src/content/items';
import { REED_BED, isPondWater, pondCellAt } from '../../src/content/pondMap';
import { GameState } from '../../src/core/GameState';
import { createRng } from '../../src/core/Rng';
import { UseItemCommand } from '../../src/patterns/command/UseItemCommand';
import { UseMoveCommand } from '../../src/patterns/command/UseMoveCommand';
import { BossAI } from '../../src/patterns/strategy/BossAI';
import { DayBeingFactory } from '../../src/patterns/factory/DayBeingFactory';
import { NightBeingFactory } from '../../src/patterns/factory/NightBeingFactory';
import { ReedGuardian } from '../../src/patterns/factory/ReedGuardian';
import { Peck } from '../../src/patterns/strategy/Peck';
import { Quack } from '../../src/patterns/strategy/Quack';

/** Plays a fight with sensible play: eat when low, Peck when there is stamina for it, Quack otherwise. */
function playFight(outfits: string[], foods: Record<string, number>): { result: BattleResult | null; turns: number } {
  const state = GameState.resetForTests();
  state.setEquipped(outfits);
  for (const [id, count] of Object.entries(foods)) for (let i = 0; i < count; i++) state.addItem(id);
  const duck = state.getDuck();
  const battle = new Battle(duck, new DayBeingFactory(createRng(1)).spawnGuardian('reed_guardian'), () => 0.99);
  const peck = new Peck();
  const quack = new Quack();
  let turns = 0;
  while (!battle.isOver() && turns < 300) {
    turns += 1;
    if (duck.getHp() <= 8 && state.countOf('bread') > 0) battle.submit(new UseItemCommand(duck, duck, ITEMS.bread));
    else if (duck.getHp() <= 6 && state.countOf('berry') > 0) battle.submit(new UseItemCommand(duck, duck, ITEMS.berry));
    else if (duck.getStamina() >= peck.staminaCost) battle.submit(new UseMoveCommand(duck, battle.enemy, peck));
    else battle.submit(new UseMoveCommand(duck, battle.enemy, quack));
    battle.playTurn();
  }
  return { result: battle.getResult(), turns };
}

describe('The Reed Warden (guardian of the reeds)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('is made by the creators (a second factory method) and is a tough boss-style being', () => {
    for (const factory of [new DayBeingFactory(), new NightBeingFactory()]) {
      const guardian = factory.spawnGuardian('reed_guardian');
      expect(guardian).toBeInstanceOf(ReedGuardian);
      expect(guardian.ai).toBeInstanceOf(BossAI);
      expect(guardian.getMaxHp()).toBe(config.beings.reed_guardian.maxHp);
      expect(guardian.follows).toBe(false);
      expect(guardian.getSprites()).toEqual(['being/reed_guardian']);
    }
  });

  it('never comes out of the random spawn tables', () => {
    const factory = new NightBeingFactory(createRng(3));
    for (let i = 0; i < 500; i++) expect(factory.spawn()).not.toBeInstanceOf(ReedGuardian);
  });

  it('always pays its drop and its reward', () => {
    expect(new ReedGuardian().dropChance).toBe(1);
    const state = GameState.getInstance();
    const duck = state.getDuck();
    const guardian = new ReedGuardian();
    guardian.takeDamage(guardian.getMaxHp() - 1);
    const battle = new Battle(duck, guardian, () => 0.999);
    battle.submit(new UseMoveCommand(duck, guardian, new Peck()));
    battle.playTurn();
    expect(battle.getResult()).toBe('win');
    expect(state.getCoins()).toBe(config.beings.reed_guardian.reward);
    expect(state.countOf('seed_cake')).toBe(1);
  });

  it('cannot be beaten with the bare duck, even with the starting food and a few breads', () => {
    expect(playFight([], { berry: 2 }).result).toBe('lose');
    expect(playFight([], { berry: 2, bread: 3 }).result).toBe('lose');
  });

  it('can be beaten once the duck has bought the outfits and has food', () => {
    const geared = playFight(['hat', 'sweater', 'rapper'], { berry: 2, bread: 4 });
    expect(geared.result).toBe('win');
    expect(geared.turns).toBeGreaterThan(5); // a long fight, not a single exchange
  });

  it('the outfits it takes are affordable after some fights: the three attack outfits cost less than the guardian pays twice', () => {
    const price = config.shop.outfit.hat + config.shop.outfit.sweater + config.shop.outfit.rapper;
    expect(price).toBeLessThan(config.beings.reed_guardian.reward * 2 + config.startingCoins);
  });

  it('is away for a while after it was beaten, then comes back', () => {
    expect(guardianPresent(undefined, 0)).toBe(true);
    expect(guardianPresent(4, 4)).toBe(false);
    expect(guardianPresent(4, 5)).toBe(false);
    expect(guardianPresent(4, 4 + config.guardianRespawnChanges)).toBe(true);
  });

  it('stands in the reed bed, in water, and has something to say before the fight', () => {
    expect(isPondWater(REED_BED.x, REED_BED.y + 14)).toBe(true);
    expect(pondCellAt(REED_BED.x, REED_BED.y)).toBe('W');
    expect(dialogueFor('reed_guardian', 'Reed Warden', 'fight').length).toBeGreaterThan(1);
  });
});
