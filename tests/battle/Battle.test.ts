import { beforeEach, describe, expect, it } from 'vitest';
import { Battle } from '../../src/battle/Battle';
import { BattleLog } from '../../src/battle/BattleLog';
import { config } from '../../src/config';
import { ITEMS } from '../../src/content/items';
import { GameState } from '../../src/core/GameState';
import type { BattleCommand } from '../../src/patterns/command/BattleCommand';
import { FleeCommand } from '../../src/patterns/command/FleeCommand';
import { UseItemCommand } from '../../src/patterns/command/UseItemCommand';
import { UseMoveCommand } from '../../src/patterns/command/UseMoveCommand';
import type { Combatant } from '../../src/patterns/decorator/Combatant';
import { Duck } from '../../src/patterns/decorator/Duck';
import type { Being } from '../../src/patterns/factory/Being';
import { TrashMob } from '../../src/patterns/factory/TrashMob';
import { WildDuck } from '../../src/patterns/factory/WildDuck';
import type { EnemyAI } from '../../src/patterns/strategy/EnemyAI';
import type { Move } from '../../src/patterns/strategy/Move';
import { Peck } from '../../src/patterns/strategy/Peck';
import { Recorder } from '../helpers';

/** An AI that always uses the given move. */
function always(move: Move): EnemyAI {
  return { chooseCommand: (self: Being, player: Combatant) => new UseMoveCommand(self, player, move) };
}

/** A command that only records when it ran. */
function marker(name: string, priority: number, order: string[]): BattleCommand {
  return { actor: new Duck(), priority, execute: () => void order.push(name) };
}

const never = (): number => 0.99;
const certain = (): number => 0;

describe('Battle (Invoker of battle commands)', () => {
  let state: GameState;

  beforeEach(() => {
    state = GameState.resetForTests();
  });

  it('runs commands by priority, highest first; ties keep submission order with the player first', () => {
    const order: string[] = [];
    const enemy = new WildDuck();
    enemy.ai = { chooseCommand: () => marker('enemy-0', 0, order) };
    const battle = new Battle(new Duck(), enemy);
    battle.submit(marker('player-0', 0, order));
    battle.submit(marker('item-1', 1, order));
    battle.submit(marker('flee-2', 2, order));
    battle.playTurn();
    expect(order).toEqual(['flee-2', 'item-1', 'player-0', 'enemy-0']);
  });

  it('emits hp-changed after each command and log-added for each line', () => {
    const enemy = new WildDuck();
    enemy.ai = always(new Peck());
    const battle = new Battle(state.getDuck(), enemy);
    const rec = new Recorder();
    battle.attach(rec);
    battle.submit(new UseMoveCommand(battle.player, enemy, new Peck()));
    battle.playTurn();
    // after the two commands, one more update carries the stamina that came back at the end of the turn
    expect(rec.names()).toEqual(['log-added', 'hp-changed', 'log-added', 'hp-changed', 'hp-changed']);
    expect(rec.of('hp-changed')[1]).toMatchObject({ playerHp: 18, playerMaxHp: 20, enemyHp: 7, enemyMaxHp: 10 });
  });

  it('a dead actor\'s command is skipped', () => {
    const actor = new Duck();
    const target = new Duck();
    actor.takeDamage(999);
    const log = new BattleLog();
    new UseMoveCommand(actor, target, new Peck()).execute(log);
    expect(target.getHp()).toBe(20);
    expect(log.getLines()).toHaveLength(0);
  });

  it('stops the turn as soon as the battle is over: a defeated enemy does not strike back', () => {
    state.setEquipped(['hat', 'sweater', 'rapper']); // attack 9
    const enemy = new WildDuck(); // 10 HP
    enemy.ai = always(new Peck());
    enemy.takeDamage(2);
    const battle = new Battle(state.getDuck(), enemy, never);
    battle.submit(new UseMoveCommand(battle.player, enemy, new Peck()));
    battle.playTurn();
    expect(battle.isOver()).toBe(true);
    expect(battle.getResult()).toBe('win');
    expect(battle.player.getHp()).toBe(20);
  });

  it('a win pays the reward coins, and the drop when the roll succeeds', () => {
    const fight = (rng: () => number): void => {
      const enemy = new TrashMob();
      enemy.takeDamage(13);
      const battle = new Battle(state.getDuck(), enemy, rng);
      battle.submit(new UseMoveCommand(battle.player, enemy, new Peck()));
      battle.playTurn();
    };
    fight(never);
    expect(state.getCoins()).toBe(config.beings.trash_mob.reward);
    expect(state.countOf('bread')).toBe(0);
    fight(certain);
    expect(state.getCoins()).toBe(config.beings.trash_mob.reward * 2);
    expect(state.countOf('bread')).toBe(1);
  });

  it('flee ends the battle before anyone attacks, with no penalty', () => {
    const enemy = new WildDuck();
    enemy.ai = always(new Peck());
    const battle = new Battle(state.getDuck(), enemy);
    const rec = new Recorder();
    battle.attach(rec);
    battle.submit(new FleeCommand(battle.player, battle, certain));
    battle.playTurn();
    expect(battle.getResult()).toBe('fled');
    expect(rec.of('battle-ended')).toEqual(['fled']);
    expect(battle.player.getHp()).toBe(20);
    expect(state.getCoins()).toBe(0);
    // nothing more happens once it is over
    battle.submit(new UseMoveCommand(battle.player, enemy, new Peck()));
    battle.playTurn();
    expect(enemy.getHp()).toBe(10);
  });

  it('items heal, are consumed through GameState, and act before moves', () => {
    const enemy = new WildDuck();
    enemy.ai = always(new Peck());
    const battle = new Battle(state.getDuck(), enemy);
    battle.player.takeDamage(10);
    battle.submit(new UseItemCommand(battle.player, battle.player, ITEMS.berry));
    battle.playTurn();
    // healed 5 first (10 -> 15), then pecked for 2
    expect(battle.player.getHp()).toBe(13);
    expect(state.countOf('berry')).toBe(1);
  });

  it('losing restores the duck to half HP and costs a quarter of the coins', () => {
    state.addCoins(40);
    const enemy = new WildDuck();
    enemy.ai = always(new Peck());
    const battle = new Battle(state.getDuck(), enemy);
    battle.player.takeDamage(19);
    battle.submit(new UseMoveCommand(battle.player, enemy, new Peck()));
    battle.playTurn();
    expect(battle.getResult()).toBe('lose');
    expect(state.getDuck().getHp()).toBe(10);
    expect(state.getCoins()).toBe(40 - Math.floor(40 * config.loseCoinsFraction)); // 30
  });

  it('the player is a snapshot: outfits changed later do not affect the running battle', () => {
    state.setEquipped(['hat']);
    const enemy = new TrashMob();
    enemy.ai = always(new Peck());
    const battle = new Battle(state.getDuck(), enemy);
    state.setEquipped([]);
    battle.submit(new UseMoveCommand(battle.player, enemy, new Peck()));
    battle.playTurn();
    expect(enemy.getHp()).toBe(14 - 4);
  });
});
