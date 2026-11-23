import { defaultRng, type Rng } from '../../core/Rng';
import type { BattleCommand } from '../command/BattleCommand';
import { UseMoveCommand } from '../command/UseMoveCommand';
import type { Combatant } from '../decorator/Combatant';
import type { Being } from '../factory/Being';
import type { EnemyAI } from './EnemyAI';

/** Strategy pattern, ConcreteStrategy: picks a random move. */
export class RandomAI implements EnemyAI {
  private readonly rng: Rng;

  constructor(rng: Rng = defaultRng) {
    this.rng = rng;
  }

  chooseCommand(self: Being, player: Combatant): BattleCommand {
    const index = Math.min(self.moves.length - 1, Math.floor(this.rng() * self.moves.length));
    return new UseMoveCommand(self, player, self.moves[index]);
  }
}
