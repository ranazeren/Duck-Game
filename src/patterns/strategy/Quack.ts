import type { BattleLog } from '../../battle/BattleLog';
import { config } from '../../config';
import type { Combatant } from '../decorator/Combatant';
import type { Move } from './Move';

/** Strategy pattern, ConcreteStrategy: a weaker sonic attack. */
export class Quack implements Move {
  name = 'Quack';
  staminaCost = config.staminaCost.quack;

  apply(user: Combatant, target: Combatant, log: BattleLog): void {
    const damage = Math.max(1, Math.ceil(user.getAttack() * config.quackFactor));
    target.takeDamage(damage);
    log.add(`${user.name} quacks at ${target.name} for ${damage}.`);
  }
}
