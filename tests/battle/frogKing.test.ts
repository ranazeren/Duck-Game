import { beforeEach, describe, expect, it } from 'vitest';
import { Battle, type BattleResult } from '../../src/battle/Battle';
import { config } from '../../src/config';
import { dialogueFor } from '../../src/content/dialogue';
import { FOREST_ARRIVAL, FOREST_BAND, FOREST_BOSS, FOREST_GAP, FOREST_TRAIL } from '../../src/content/forestMap';
import { GUARDIAN_IDS, type GuardianId, isGuardian } from '../../src/content/guardian';
import { ITEMS } from '../../src/content/items';
import { GameState } from '../../src/core/GameState';
import { createRng } from '../../src/core/Rng';
import { UseItemCommand } from '../../src/patterns/command/UseItemCommand';
import { UseMoveCommand } from '../../src/patterns/command/UseMoveCommand';
import { DayBeingFactory } from '../../src/patterns/factory/DayBeingFactory';
import { FrogKing } from '../../src/patterns/factory/FrogKing';
import { NightBeingFactory } from '../../src/patterns/factory/NightBeingFactory';
import { ReedGuardian } from '../../src/patterns/factory/ReedGuardian';
import { Peck } from '../../src/patterns/strategy/Peck';
import { Quack } from '../../src/patterns/strategy/Quack';

/** Plays a fight with sensible play: eat when low, Peck when there is stamina for it, Quack otherwise. */
function playFight(which: GuardianId, outfits: string[], foods: Record<string, number>): { result: BattleResult | null; turns: number } {
  const state = GameState.resetForTests();
  state.setEquipped(outfits);
  for (const [id, count] of Object.entries(foods)) for (let i = 0; i < count; i++) state.addItem(id);
  const duck = state.getDuck();
  const battle = new Battle(duck, new DayBeingFactory(createRng(1)).spawnGuardian(which), () => 0.99);
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

describe('The Frog King (the easier boss of the forest)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('is made by both creators through the same factory method, and is a different guardian from the Reed Warden', () => {
    for (const factory of [new DayBeingFactory(), new NightBeingFactory()]) {
      expect(factory.spawnGuardian('frog_king')).toBeInstanceOf(FrogKing);
      expect(factory.spawnGuardian('reed_guardian')).toBeInstanceOf(ReedGuardian);
    }
    expect(GUARDIAN_IDS).toEqual(['reed_guardian', 'frog_king']);
    expect(isGuardian('frog_king')).toBe(true);
    expect(isGuardian('ghost')).toBe(false);
  });

  it('is clearly weaker than the Reed Warden but still a boss with a sure drop and a reward', () => {
    const frog = config.beings.frog_king;
    const heron = config.beings.reed_guardian;
    expect(frog.maxHp).toBeLessThan(heron.maxHp);
    expect(frog.attack).toBeLessThanOrEqual(heron.attack);
    expect(frog.maxHp).toBeGreaterThan(config.beings.robot_duck.maxHp * 1.5); // not a normal mob
    expect(new FrogKing().dropChance).toBe(1);
    expect(frog.reward).toBeGreaterThan(config.beings.robot_duck.reward);
  });

  it('can be beaten by the bare duck with a little food, and easily with an outfit', () => {
    expect(playFight('frog_king', [], { berry: 2, bread: 1 }).result).toBe('win');
    expect(playFight('frog_king', ['hat'], { berry: 2 }).result).toBe('win');
    // while the Reed Warden stays out of reach of the same bare duck
    expect(playFight('reed_guardian', [], { berry: 2, bread: 1 }).result).toBe('lose');
  });

  it('is a real fight, not a single exchange, and the bare duck can also lose it without food', () => {
    const bare = playFight('frog_king', [], { berry: 2, bread: 1 });
    expect(bare.turns).toBeGreaterThan(8);
    expect(playFight('frog_king', [], {}).result).toBe('lose');
  });

  it('has something to say before the fight', () => {
    expect(dialogueFor('frog_king', 'Frog King', 'fight').length).toBeGreaterThan(1);
  });
});

describe('The forest map', () => {
  it('has an opening at the left edge, a trail from it to the Frog King, and the boss inside the walkable band', () => {
    expect(FOREST_GAP.minY).toBeGreaterThanOrEqual(FOREST_BAND.minY);
    expect(FOREST_GAP.maxY).toBeLessThanOrEqual(FOREST_BAND.maxY);
    const first = FOREST_TRAIL.points[0];
    const last = FOREST_TRAIL.points[FOREST_TRAIL.points.length - 1];
    expect(first[0]).toBe(0);
    expect(first[1]).toBeGreaterThan(FOREST_GAP.minY);
    expect(first[1]).toBeLessThan(FOREST_GAP.maxY);
    expect(Math.hypot(last[0] - FOREST_BOSS.x, last[1] - FOREST_BOSS.y)).toBeLessThan(30);
    expect(FOREST_BOSS.y).toBeGreaterThan(FOREST_BAND.minY);
    expect(FOREST_BOSS.y).toBeLessThan(FOREST_BAND.maxY);
  });

  it('the duck arrives inside the opening, wherever it left the farm', () => {
    expect(FOREST_ARRIVAL.minY).toBeGreaterThan(FOREST_GAP.minY);
    expect(FOREST_ARRIVAL.maxY).toBeLessThan(FOREST_GAP.maxY);
  });
});
