import type { BattleLog } from '../../battle/BattleLog';
import { config } from '../../config';
import type { Combatant } from '../decorator/Combatant';
import type { Move } from './Move';

/** Strategy pattern, ConcreteStrategy: full attack damage. */
export class Peck implements Move {
  name = 'Peck';
  staminaCost = config.staminaCost.peck;

  apply(user: Combatant, target: Combatant, log: BattleLog): void {
    const damage = user.getAttack();
    target.takeDamage(damage);
    log.add(`${user.name} pecks ${target.name} for ${damage}.`);
  }
}
