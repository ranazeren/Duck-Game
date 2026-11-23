import type { BattleLog } from '../../battle/BattleLog';
import type { Combatant } from '../decorator/Combatant';

/** Strategy pattern, Strategy: one way to act in battle. */
export interface Move {
  name: string;
  /** (addition) Stamina this move costs the user. */
  staminaCost: number;
  apply(user: Combatant, target: Combatant, log: BattleLog): void;
}
