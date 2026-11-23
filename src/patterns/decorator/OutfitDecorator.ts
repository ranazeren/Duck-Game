import type { Combatant } from './Combatant';

/** Decorator pattern, Decorator: every method delegates to the wrapped Combatant. */
export abstract class OutfitDecorator implements Combatant {
  constructor(protected inner: Combatant) {}

  get name(): string {
    return this.inner.name;
  }

  getAttack(): number {
    return this.inner.getAttack();
  }

  getSprites(): string[] {
    return this.inner.getSprites();
  }

  getMoveSpeed(): number {
    return this.inner.getMoveSpeed();
  }

  getAttackSpeed(): number {
    return this.inner.getAttackSpeed();
  }

  getStamina(): number {
    return this.inner.getStamina();
  }

  getMaxStamina(): number {
    return this.inner.getMaxStamina();
  }

  spendStamina(n: number): boolean {
    return this.inner.spendStamina(n);
  }

  restoreStamina(n: number): void {
    this.inner.restoreStamina(n);
  }

  takeDamage(n: number): void {
    this.inner.takeDamage(n);
  }

  heal(n: number): void {
    this.inner.heal(n);
  }

  getHp(): number {
    return this.inner.getHp();
  }

  getMaxHp(): number {
    return this.inner.getMaxHp();
  }

  isAlive(): boolean {
    return this.inner.isAlive();
  }
}
