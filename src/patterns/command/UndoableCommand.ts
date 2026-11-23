/** Command pattern (house), Command. */
export interface UndoableCommand {
  execute(): void;
  undo(): void;
}
