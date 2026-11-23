/** Decorator pattern, Component. */
export interface Combatant {
  name: string;
  getAttack(): number;
  /** Asset keys, bottom layer first. */
  getSprites(): string[];
  /** (addition) Walking speed in pixels per second. Outfits can add to it. */
  getMoveSpeed(): number;
  /** (addition) Decides who acts first when two commands of the same priority meet. Outfits can add to it. */
  getAttackSpeed(): number;
  takeDamage(n: number): void;
  /** (addition) Moves cost stamina. `spendStamina` returns false (and spends nothing) when there is not enough. */
  getStamina(): number;
  getMaxStamina(): number;
  spendStamina(n: number): boolean;
  restoreStamina(n: number): void;
  // (additions) the HUD, the battle and items need them
  getHp(): number;
  getMaxHp(): number;
  isAlive(): boolean;
  heal(n: number): void;
}
