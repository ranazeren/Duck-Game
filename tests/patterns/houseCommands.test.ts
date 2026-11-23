import { beforeEach, describe, expect, it } from 'vitest';
import { GameState } from '../../src/core/GameState';
import { CommandHistory } from '../../src/patterns/command/CommandHistory';
import { EquipOutfitCommand } from '../../src/patterns/command/EquipOutfitCommand';
import { PlaceItemCommand } from '../../src/patterns/command/PlaceItemCommand';
import { RemoveItemCommand } from '../../src/patterns/command/RemoveItemCommand';
import type { UndoableCommand } from '../../src/patterns/command/UndoableCommand';

class Counter implements UndoableCommand {
  static value = 0;
  execute(): void {
    Counter.value += 1;
  }
  undo(): void {
    Counter.value -= 1;
  }
}

describe('CommandHistory (Invoker)', () => {
  beforeEach(() => {
    Counter.value = 0;
  });

  it('runs, undoes and redoes', () => {
    const history = new CommandHistory();
    history.run(new Counter());
    history.run(new Counter());
    expect(Counter.value).toBe(2);
    history.undo();
    expect(Counter.value).toBe(1);
    history.redo();
    expect(Counter.value).toBe(2);
  });

  it('a new action clears the redo stack', () => {
    const history = new CommandHistory();
    history.run(new Counter());
    history.undo();
    expect(history.canRedo()).toBe(true);
    history.run(new Counter());
    expect(history.canRedo()).toBe(false);
    history.redo();
    expect(Counter.value).toBe(1);
  });

  it('undo and redo on empty stacks do nothing, and clear empties both', () => {
    const history = new CommandHistory();
    history.undo();
    history.redo();
    expect(Counter.value).toBe(0);
    history.run(new Counter());
    history.run(new Counter());
    history.undo();
    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });
});

describe('House commands (receiver: GameState)', () => {
  let state: GameState;
  let history: CommandHistory;

  beforeEach(() => {
    state = GameState.resetForTests();
    history = new CommandHistory();
  });

  it('PlaceItemCommand puts furniture in the slot and takes it out again on undo, without using it up', () => {
    state.unlock('chair');
    history.run(new PlaceItemCommand('c1r1', 'chair'));
    expect(state.getPlaced('c1r1')).toBe('chair');
    expect(state.isUnlocked('chair')).toBe(true);
    history.undo();
    expect(state.getPlaced('c1r1')).toBeNull();
    history.redo();
    expect(state.getPlaced('c1r1')).toBe('chair');
  });

  it('the same unlocked furniture can be placed in many slots at once', () => {
    state.unlock('lamp');
    history.run(new PlaceItemCommand('c0r0', 'lamp'));
    history.run(new PlaceItemCommand('c1r0', 'lamp'));
    history.run(new PlaceItemCommand('c2r0', 'lamp'));
    expect([...state.getPlacedItems().values()]).toEqual(['lamp', 'lamp', 'lamp']);
    history.undo();
    expect(state.getPlacedItems().size).toBe(2);
  });

  it('placing on an occupied slot and undoing restores the previous item', () => {
    state.unlock('chair');
    state.unlock('lamp');
    history.run(new PlaceItemCommand('c0r0', 'chair'));
    history.run(new PlaceItemCommand('c0r0', 'lamp'));
    expect(state.getPlaced('c0r0')).toBe('lamp');
    history.undo();
    expect(state.getPlaced('c0r0')).toBe('chair');
  });

  it('RemoveItemCommand clears the slot, and puts the item back on undo', () => {
    state.unlock('rug');
    history.run(new PlaceItemCommand('c3r3', 'rug'));
    history.run(new RemoveItemCommand('c3r3'));
    expect(state.getPlaced('c3r3')).toBeNull();
    history.undo();
    expect(state.getPlaced('c3r3')).toBe('rug');
  });

  it('EquipOutfitCommand toggles an outfit and restores the previous list on undo', () => {
    history.run(new EquipOutfitCommand('hat'));
    history.run(new EquipOutfitCommand('sweater'));
    expect(state.getEquipped()).toEqual(['hat', 'sweater']);
    history.run(new EquipOutfitCommand('hat'));
    expect(state.getEquipped()).toEqual(['sweater']);
    history.undo();
    expect(state.getEquipped()).toEqual(['hat', 'sweater']);
    history.undo();
    history.undo();
    expect(state.getEquipped()).toEqual([]);
  });
});
