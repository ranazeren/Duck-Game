import type { BattleCommand } from '../command/BattleCommand';
import { UseMoveCommand } from '../command/UseMoveCommand';
import type { Combatant } from '../decorator/Combatant';
import type { Being } from '../factory/Being';
import type { EnemyAI } from './EnemyAI';

/** Strategy pattern, ConcreteStrategy: cycles the moves in order; every third turn uses the last move. */
export class BossAI implements EnemyAI {
  private turn = 0;
  private cycle = 0;

  chooseCommand(self: Being, player: Combatant): BattleCommand {
    this.turn += 1;
    const moves = self.moves;
    const move = this.turn % 3 === 0 ? moves[moves.length - 1] : moves[this.cycle++ % moves.length];
    return new UseMoveCommand(self, player, move);
  }
}
