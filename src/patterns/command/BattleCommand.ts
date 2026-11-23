import type { BattleLog } from '../../battle/BattleLog';
import type { Combatant } from '../decorator/Combatant';

/** Command pattern (battle), Command. Battle commands have no undo. */
export interface BattleCommand {
  actor: Combatant;
  priority: number;
  execute(log: BattleLog): void;
}
