import { config, type BeingId } from '../../config';
import type { BattleCommand } from '../command/BattleCommand';
import type { Combatant } from '../decorator/Combatant';
import type { EnemyAI } from '../strategy/EnemyAI';
import type { Move } from '../strategy/Move';
import { Peck } from '../strategy/Peck';
import { Quack } from '../strategy/Quack';
import { RandomAI } from '../strategy/RandomAI';

/**
 * Factory Method (beings), Product. Also a Decorator Component, so battle code treats it like the duck.
 * It is the Strategy context for EnemyAI: it has-a `ai`, assigned by the factory (Nest 7).
 */
export abstract class Being implements Combatant {
  readonly id: BeingId;
  name: string;
  readonly reward: number;
  readonly drop?: string;
  /** (addition) Chance that the drop is paid out when it is beaten (most beings: config.dropChance). */
  readonly dropChance: number;
  readonly boss: boolean;
  /** (addition) Whether this being walks toward the duck. Decided by the factory when it spawns. */
  follows = false;
  ai: EnemyAI = new RandomAI();
  /** (addition) the moves the AI chooses from. */
  moves: Move[] = [new Peck(), new Quack()];
  private hp: number;
  private readonly maxHp: number;
  private readonly attack: number;

  protected constructor(id: BeingId, boss = false) {
    const stats = config.beings[id];
    const multiplier = boss ? config.bossStatMultiplier : 1;
    this.id = id;
    this.boss = boss;
    this.name = boss ? `Boss ${stats.name}` : stats.name;
    this.maxHp = stats.maxHp * multiplier;
    this.hp = this.maxHp;
    this.attack = stats.attack * multiplier;
    this.reward = stats.reward;
    this.drop = stats.drop;
    this.dropChance = 'dropChance' in stats ? stats.dropChance : config.dropChance;
  }

  abstract getSprites(): string[];

  /** (addition) Strategy context: the battle asks the being, and the being forwards the question to its AI. */
  chooseCommand(player: Combatant): BattleCommand {
    return this.ai.chooseCommand(this, player);
  }

  /** Beings never run out of stamina (only the duck is limited). */
  getStamina(): number {
    return this.getMaxStamina();
  }

  getMaxStamina(): number {
    return 99;
  }

  spendStamina(): boolean {
    return true;
  }

  restoreStamina(): void {
    // nothing to restore
  }

  getMoveSpeed(): number {
    return config.beings[this.id].approachSpeed;
  }

  getAttackSpeed(): number {
    return config.beings[this.id].attackSpeed;
  }

  getAttack(): number {
    return this.attack;
  }

  takeDamage(n: number): void {
    this.hp = Math.max(0, this.hp - Math.max(0, n));
  }

  heal(n: number): void {
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, n));
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.maxHp;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }
}
