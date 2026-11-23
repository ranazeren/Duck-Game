import { GameState } from '../../core/GameState';
import type { UndoableCommand } from './UndoableCommand';

/** Command pattern (house), ConcreteCommand. Receiver: GameState (Nest 1), stored when the command is made. */
export class RemoveItemCommand implements UndoableCommand {
  private readonly slotId: string;
  private readonly receiver: GameState;
  private removedItem: string | null = null;

  constructor(slotId: string, receiver: GameState = GameState.getInstance()) {
    this.receiver = receiver;
    this.slotId = slotId;
  }

  execute(): void {
    this.removedItem = this.receiver.getPlaced(this.slotId);
    if (this.removedItem === null) return;
    this.receiver.setPlaced(this.slotId, null);
  }

  undo(): void {
    if (this.removedItem === null) return;
    this.receiver.setPlaced(this.slotId, this.removedItem);
  }
}
