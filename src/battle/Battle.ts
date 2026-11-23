import { config } from '../config';
import { getItem } from '../content/items';
import { GameState } from '../core/GameState';
import { defaultRng, type Rng } from '../core/Rng';
import { Subject } from '../core/Subject';
import type { BattleCommand } from '../patterns/command/BattleCommand';
import type { Combatant } from '../patterns/decorator/Combatant';
import type { Being } from '../patterns/factory/Being';
import { BattleLog } from './BattleLog';

export type BattleResult = 'win' | 'lose' | 'fled';

export interface HpSnapshot {
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  playerStamina: number;
  playerMaxStamina: number;
}

/**
 * Command pattern (battle), Invoker, and a concrete Subject.
 * Events: hp-changed (HpSnapshot), log-added (string), battle-ended (BattleResult).
 */
export class Battle extends Subject {
  readonly player: Combatant;
  readonly enemy: Being;
  private queue: BattleCommand[] = [];
  private result: BattleResult | null = null;
  private readonly log: BattleLog;
  private readonly rng: Rng;

  /** `player` is a snapshot from GameState.getDuck() taken when the battle starts. */
  constructor(player: Combatant, enemy: Being, rng: Rng = defaultRng) {
    super();
    this.player = player;
    this.enemy = enemy;
    // Every fight starts with full stamina.
    player.restoreStamina(player.getMaxStamina());
    this.rng = rng;
    this.log = new BattleLog((line) => this.notify('log-added', line));
  }

  submit(cmd: BattleCommand): void {
    if (this.isOver()) return;
    this.queue.push(cmd);
  }

  playTurn(): void {
    if (this.isOver()) {
      this.queue = [];
      return;
    }
    // Nest 6: the enemy (the Strategy context) asks its AI, which answers with a command.
    this.queue.push(this.enemy.chooseCommand(this.player));
    // Higher priority first; within a priority the faster actor (attack speed) goes first.
    // Array.prototype.sort is stable: full ties keep submission order, player first.
    const ordered = [...this.queue].sort(
      (a, b) => b.priority - a.priority || b.actor.getAttackSpeed() - a.actor.getAttackSpeed(),
    );
    this.queue = [];
    for (const cmd of ordered) {
      cmd.execute(this.log);
      this.notify('hp-changed', this.hpSnapshot());
      if (this.result === null) {
        if (!this.player.isAlive()) this.end('lose');
        else if (!this.enemy.isAlive()) this.end('win');
      }
      if (this.isOver()) break;
    }
    // A little stamina comes back every turn.
    if (!this.isOver()) {
      this.player.restoreStamina(config.staminaRegen);
      this.notify('hp-changed', this.hpSnapshot());
    }
  }

  isOver(): boolean {
    return this.result !== null || !this.player.isAlive() || !this.enemy.isAlive();
  }

  getResult(): BattleResult | null {
    return this.result;
  }

  hpSnapshot(): HpSnapshot {
    return {
      playerHp: this.player.getHp(),
      playerMaxHp: this.player.getMaxHp(),
      enemyHp: this.enemy.getHp(),
      enemyMaxHp: this.enemy.getMaxHp(),
      playerStamina: this.player.getStamina(),
      playerMaxStamina: this.player.getMaxStamina(),
    };
  }

  end(result: BattleResult): void {
    if (this.result !== null) return;
    this.result = result;
    if (result === 'win') {
      // Nest 1: the battle pays rewards into the one GameState.
      const state = GameState.getInstance();
      state.addCoins(this.enemy.reward);
      this.log.add(`${this.enemy.name} is defeated. You win ${this.enemy.reward} coins.`);
      if (this.enemy.drop && this.rng() < this.enemy.dropChance) {
        state.addItem(this.enemy.drop);
        this.log.add(`${this.enemy.name} dropped a ${getItem(this.enemy.drop)?.name ?? this.enemy.drop}.`);
      }
    } else if (result === 'lose') {
      const restored = Math.max(1, Math.floor(this.player.getMaxHp() * config.loseHpFraction));
      this.player.heal(restored);
      // Losing costs part of the coins; the duck wakes up at home (BattleScene sends it there).
      const state = GameState.getInstance();
      const lost = Math.floor(state.getCoins() * config.loseCoinsFraction);
      if (lost > 0) state.addCoins(-lost);
      this.log.add(
        lost > 0
          ? `${this.player.name} is knocked out and drops ${lost} coins. It wakes up at home.`
          : `${this.player.name} is knocked out and wakes up at home.`,
      );
    }
    this.notify('battle-ended', result);
  }
}
