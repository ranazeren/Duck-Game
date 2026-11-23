import { Assets } from '../../assets/Assets';
import { config } from '../../config';
import type { Combatant } from './Combatant';

/** Decorator pattern, ConcreteComponent: the one real duck that holds the HP. */
export class Duck implements Combatant {
  name = 'Duck';
  private hp: number;
  private stamina: number;
  private readonly maxStamina: number;
  private readonly maxHp: number;
  private readonly baseAttack: number;

  constructor(maxHp: number = config.duck.maxHp, baseAttack: number = config.duck.attack) {
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.baseAttack = baseAttack;
    this.maxStamina = config.duck.maxStamina;
    this.stamina = this.maxStamina;
  }

  getAttack(): number {
    return this.baseAttack;
  }

  getSprites(): string[] {
    return [Assets.key('player', 'duck_base')];
  }

  takeDamage(n: number): void {
    this.hp = Math.max(0, this.hp - Math.max(0, n));
  }

  heal(n: number): void {
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, n));
  }

  getStamina(): number {
    return this.stamina;
  }

  getMaxStamina(): number {
    return this.maxStamina;
  }

  spendStamina(n: number): boolean {
    if (n > this.stamina) return false;
    this.stamina -= Math.max(0, n);
    return true;
  }

  restoreStamina(n: number): void {
    this.stamina = Math.min(this.maxStamina, this.stamina + Math.max(0, n));
  }

  getMoveSpeed(): number {
    return config.playerSpeed;
  }

  getAttackSpeed(): number {
    return config.duck.attackSpeed;
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
