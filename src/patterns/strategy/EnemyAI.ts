import type { BattleCommand } from '../command/BattleCommand';
import type { Combatant } from '../decorator/Combatant';
import type { Being } from '../factory/Being';

/** Strategy pattern, Strategy: how an enemy decides. What it returns is a command (Nest 6). */
export interface EnemyAI {
  chooseCommand(self: Being, player: Combatant): BattleCommand;
}
