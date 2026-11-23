import type { BattleLog } from '../../battle/BattleLog';
import type { Item } from '../../content/Item';
import { GameState } from '../../core/GameState';
import type { Combatant } from '../decorator/Combatant';
import type { BattleCommand } from './BattleCommand';

/** Command pattern (battle), ConcreteCommand. Consumes the item through GameState (see NOTES.md). */
export class UseItemCommand implements BattleCommand {
  readonly priority = 1;
  readonly actor: Combatant;
  private readonly target: Combatant;
  private readonly item: Item;
  private readonly inventory: GameState;

  constructor(actor: Combatant, target: Combatant, item: Item, inventory: GameState = GameState.getInstance()) {
    this.inventory = inventory;
    this.actor = actor;
    this.target = target;
    this.item = item;
  }

  execute(log: BattleLog): void {
    if (!this.actor.isAlive()) return;
    this.item.use(this.target, log);
    this.inventory.removeItem(this.item.id);
  }
}
