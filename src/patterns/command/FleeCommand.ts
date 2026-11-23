import type { Battle } from '../../battle/Battle';
import type { BattleLog } from '../../battle/BattleLog';
import { config } from '../../config';
import { defaultRng, type Rng } from '../../core/Rng';
import type { Combatant } from '../decorator/Combatant';
import type { BattleCommand } from './BattleCommand';

/** Command pattern (battle), ConcreteCommand. */
export class FleeCommand implements BattleCommand {
  readonly priority = 2;
  readonly actor: Combatant;
  private readonly battle: Battle;
  private readonly rng: Rng;

  constructor(actor: Combatant, battle: Battle, rng: Rng = defaultRng) {
    this.actor = actor;
    this.battle = battle;
    this.rng = rng;
  }

  execute(log: BattleLog): void {
    if (!this.actor.isAlive()) return;
    if (this.rng() < config.fleeChance) {
      log.add(`${this.actor.name} flees!`);
      this.battle.end('fled');
    } else {
      log.add(`${this.actor.name} failed to flee.`);
    }
  }
}
