import { GameState } from '../../core/GameState';
import type { UndoableCommand } from './UndoableCommand';

/**
 * Command pattern (house), ConcreteCommand. Receiver: GameState (Nest 1), stored when the command is made.
 * Furniture is unlocked once and never used up, so placing it only changes the slot.
 */
export class PlaceItemCommand implements UndoableCommand {
  private readonly slotId: string;
  private readonly itemId: string;
  private readonly receiver: GameState;
  private previousOccupant: string | null = null;

  constructor(slotId: string, itemId: string, receiver: GameState = GameState.getInstance()) {
    this.receiver = receiver;
    this.slotId = slotId;
    this.itemId = itemId;
  }

  execute(): void {
    this.previousOccupant = this.receiver.getPlaced(this.slotId);
    this.receiver.setPlaced(this.slotId, this.itemId);
  }

  undo(): void {
    this.receiver.setPlaced(this.slotId, this.previousOccupant);
  }
}
