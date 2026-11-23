import { GameState } from '../../core/GameState';
import type { UndoableCommand } from './UndoableCommand';

/** Command pattern (house), ConcreteCommand: toggles one outfit. Receiver: GameState (Nest 1), stored when the command is made. */
export class EquipOutfitCommand implements UndoableCommand {
  private readonly outfitId: string;
  private readonly receiver: GameState;
  private previousList: string[] = [];

  constructor(outfitId: string, receiver: GameState = GameState.getInstance()) {
    this.receiver = receiver;
    this.outfitId = outfitId;
  }

  execute(): void {
    this.previousList = [...this.receiver.getEquipped()];
    const newList = this.previousList.includes(this.outfitId)
      ? this.previousList.filter((id) => id !== this.outfitId)
      : [...this.previousList, this.outfitId];
    this.receiver.setEquipped(newList);
  }

  undo(): void {
    this.receiver.setEquipped(this.previousList);
  }
}
