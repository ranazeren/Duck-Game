import type { BattleLog } from '../battle/BattleLog';
import type { Combatant } from '../patterns/decorator/Combatant';

export type ItemKind = 'consumable' | 'furniture' | 'outfit';
export type ItemEffect = (target: Combatant, log: BattleLog, item: Item) => void;

/** Plain class: an inventory entry. Only furniture is placeable, only consumables do something in battle. */
export class Item {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kind: ItemKind;
  private readonly effect: ItemEffect | null;

  constructor(id: string, name: string, description: string, kind: ItemKind, effect: ItemEffect | null = null) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.kind = kind;
    this.effect = effect;
  }

  get placeable(): boolean {
    return this.kind === 'furniture';
  }

  use(target: Combatant, log: BattleLog): void {
    if (!this.effect) {
      log.add(`${this.name} has no effect.`);
      return;
    }
    this.effect(target, log, this);
  }
}
