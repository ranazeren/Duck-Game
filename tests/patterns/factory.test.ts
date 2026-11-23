import { beforeEach, describe, expect, it } from 'vitest';
import { config, type BeingId } from '../../src/config';
import { DIALOGUE, dialogueFor, type Talk } from '../../src/content/dialogue';
import { GameState } from '../../src/core/GameState';
import { createRng } from '../../src/core/Rng';
import { BattleEncounter } from '../../src/patterns/factory/BattleEncounter';
import { BattleEncounterFactory } from '../../src/patterns/factory/BattleEncounterFactory';
import type { Being } from '../../src/patterns/factory/Being';
import type { BeingFactory } from '../../src/patterns/factory/BeingFactory';
import { DayBeingFactory } from '../../src/patterns/factory/DayBeingFactory';
import { Ghost } from '../../src/patterns/factory/Ghost';
import { GiftEncounter } from '../../src/patterns/factory/GiftEncounter';
import { GiftEncounterFactory } from '../../src/patterns/factory/GiftEncounterFactory';
import { NightBeingFactory } from '../../src/patterns/factory/NightBeingFactory';
import { RobotDuck } from '../../src/patterns/factory/RobotDuck';
import { TrashMob } from '../../src/patterns/factory/TrashMob';
import { WildDuck } from '../../src/patterns/factory/WildDuck';
import { BossAI } from '../../src/patterns/strategy/BossAI';
import { RandomAI } from '../../src/patterns/strategy/RandomAI';

function spawnMany(factory: BeingFactory, n: number): Being[] {
  return Array.from({ length: n }, () => factory.spawn());
}

describe('BeingFactory (Factory Method, seeded Rng)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('the day factory only creates day beings, with the table stats', () => {
    const beings = spawnMany(new DayBeingFactory(createRng(1)), 300);
    expect(beings.every((b) => b instanceof WildDuck || b instanceof TrashMob)).toBe(true);
    expect(beings.some((b) => b instanceof WildDuck)).toBe(true);
    expect(beings.some((b) => b instanceof TrashMob)).toBe(true);
    const wild = beings.find((b) => b instanceof WildDuck)!;
    expect([wild.getMaxHp(), wild.getAttack(), wild.reward, wild.drop]).toEqual([10, 2, 3, 'berry']);
    expect(wild.getSprites()).toEqual(['being/wild_duck']);
  });

  it('the night factory only creates night beings', () => {
    const beings = spawnMany(new NightBeingFactory(createRng(2)), 300);
    expect(beings.every((b) => b instanceof Ghost || b instanceof RobotDuck)).toBe(true);
    expect(beings.some((b) => b instanceof Ghost)).toBe(true);
    expect(beings.some((b) => b instanceof RobotDuck)).toBe(true);
  });

  it('follows the spawn weights roughly (70 / 30 by day)', () => {
    const beings = spawnMany(new DayBeingFactory(createRng(5)), 2000);
    const share = beings.filter((b) => b instanceof WildDuck).length / beings.length;
    expect(share).toBeGreaterThan(0.64);
    expect(share).toBeLessThan(0.76);
  });

  it('respects minCoins: no boss below the threshold (Nest 8)', () => {
    GameState.getInstance().addCoins(config.bossMinCoins - 1);
    const beings = [...spawnMany(new DayBeingFactory(createRng(9)), 500), ...spawnMany(new NightBeingFactory(createRng(9)), 500)];
    expect(beings.some((b) => b.boss)).toBe(false);
    expect(beings.every((b) => b.ai instanceof RandomAI)).toBe(true);
  });

  it('bosses appear from minCoins on, with doubled stats and a BossAI (Nest 7)', () => {
    GameState.getInstance().addCoins(config.bossMinCoins);
    const beings = spawnMany(new NightBeingFactory(createRng(4)), 1000);
    const bosses = beings.filter((b) => b.boss);
    expect(bosses.length).toBeGreaterThan(0);
    for (const boss of bosses) {
      expect(boss).toBeInstanceOf(RobotDuck);
      expect(boss.ai).toBeInstanceOf(BossAI);
      expect(boss.getMaxHp()).toBe(config.beings.robot_duck.maxHp * config.bossStatMultiplier);
      expect(boss.getAttack()).toBe(config.beings.robot_duck.attack * config.bossStatMultiplier);
    }
    expect(beings.filter((b) => !b.boss).every((b) => b.ai instanceof RandomAI)).toBe(true);
  });

  it('boss weight grows with coins', () => {
    const countBosses = (coins: number): number => {
      GameState.resetForTests().addCoins(coins);
      return spawnMany(new DayBeingFactory(createRng(11)), 3000).filter((b) => b.boss).length;
    };
    expect(countBosses(1000)).toBeGreaterThan(countBosses(50) * 2);
  });
});

describe('Dialogue content', () => {
  it('every being has befriend and fight lines, and the duck talks back in a fight', () => {
    for (const id of Object.keys(config.beings) as BeingId[]) {
      expect(dialogueFor(id, 'X', 'befriend').length).toBeGreaterThan(0);
      const fight = dialogueFor(id, 'X', 'fight');
      expect(fight.some((line) => line.speaker === 'Duck')).toBe(true);
      expect(fight.some((line) => line.speaker === 'X')).toBe(true);
    }
  });

  it('some beings are friendly and some treat the duck as an enemy', () => {
    const friendly = Object.values(DIALOGUE).map((script) => script.friendly);
    expect(friendly).toContain(true);
    expect(friendly).toContain(false);
  });
});

describe('EncounterFactory (Factory Method)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('BattleEncounterFactory creates a BattleEncounter that talks first, then starts a battle with its being', () => {
    const order: string[] = [];
    const started: Being[] = [];
    const being = new WildDuck();
    let finishTalk: () => void = () => undefined;
    const talk: Talk = (lines, onDone) => {
      order.push(`talk:${lines.length}`);
      expect(lines.some((line) => line.speaker === 'Duck')).toBe(true);
      expect(lines.some((line) => line.speaker === being.name)).toBe(true);
      finishTalk = onDone;
    };
    const encounter = new BattleEncounterFactory(talk, (b) => started.push(b)).create(being);
    expect(encounter).toBeInstanceOf(BattleEncounter);
    encounter.start();
    expect(started).toEqual([]); // nothing starts until the conversation is over
    finishTalk();
    expect(order).toEqual(['talk:3']);
    expect(started).toEqual([being]);
  });

  it('GiftEncounterFactory creates a GiftEncounter that gives the drop, toasts and despawns', () => {
    const state = GameState.getInstance();
    const calls: string[] = [];
    let finishTalk: () => void = () => undefined;
    const factory = new GiftEncounterFactory({
      talk: (lines, onDone) => {
        calls.push(`talk:${lines.length}`);
        finishTalk = onDone;
      },
      toast: (message) => calls.push(`toast:${message}`),
      despawn: () => calls.push('despawn'),
    });
    const encounter = factory.create(new TrashMob());
    expect(encounter).toBeInstanceOf(GiftEncounter);
    encounter.start();
    expect(state.countOf('bread')).toBe(0); // the gift comes after the conversation
    finishTalk();
    expect(state.countOf('bread')).toBe(1);
    expect(calls).toEqual(['talk:3', 'toast:Trash Mob gives you a Bread!', 'despawn']);
  });
});
