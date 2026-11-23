import type { UndoableCommand } from './UndoableCommand';

/** Command pattern (house), Invoker. Owned by HouseScene. */
export class CommandHistory {
  private undoStack: UndoableCommand[] = [];
  private redoStack: UndoableCommand[] = [];

  run(cmd: UndoableCommand): void {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = [];
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.execute();
    this.undoStack.push(cmd);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /** (addition) lets the on-screen buttons show whether they would do anything. */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** (addition) */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
