import type { BattleLog } from '../../battle/BattleLog';
import type { Combatant } from '../decorator/Combatant';
import type { Move } from '../strategy/Move';
import type { BattleCommand } from './BattleCommand';

/**
 * Command pattern (battle), ConcreteCommand, and the Strategy context (Nest 5):
 * it carries the chosen move and calls it when its turn comes.
 * Nest 4: actor and target are Combatants, possibly wrapped in outfits.
 */
export class UseMoveCommand implements BattleCommand {
  readonly priority = 0;
  readonly actor: Combatant;
  private readonly target: Combatant;
  private readonly move: Move;

  constructor(actor: Combatant, target: Combatant, move: Move) {
    this.actor = actor;
    this.target = target;
    this.move = move;
  }

  execute(log: BattleLog): void {
    if (!this.actor.isAlive()) return;
    if (!this.actor.spendStamina(this.move.staminaCost)) {
      log.add(`${this.actor.name} is too tired to ${this.move.name}.`);
      return;
    }
    this.move.apply(this.actor, this.target, log);
  }
}
