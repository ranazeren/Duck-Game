import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { config } from '../config';
import { RETURN_FROM_HOUSE } from '../content/farmLayout';
import { BLOCKED, EXIT_COL, GRID, cellCenter, cellId, parseCell } from '../content/houseGrid';
import { getItem, ITEMS } from '../content/items';
import { joinPlaced, splitPlaced } from '../content/placement';
import { GameState, type Phase } from '../core/GameState';
import type { Observer } from '../core/Observer';
import { CommandHistory } from '../patterns/command/CommandHistory';
import { PlaceItemCommand } from '../patterns/command/PlaceItemCommand';
import { RemoveItemCommand } from '../patterns/command/RemoveItemCommand';
import { makeButton } from '../ui/Button';
import { HouseLights } from '../ui/HouseLights';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { addEntrance, fadeInScene, isFading, setHouseHistory, toast, type SpawnData } from './sceneHelpers';

const FLOOR_TOP = 150;
/** The item being positioned while decorating. It is not on the floor until it is set down. */
interface Carried {
  itemId: string;
  col: number;
  row: number;
  /** Clockwise quarter turns. */
  rot: number;
}

const MOVE_KEYS: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  KeyA: { dx: -1, dy: 0 },
  KeyD: { dx: 1, dy: 0 },
  KeyW: { dx: 0, dy: -1 },
  KeyS: { dx: 0, dy: 1 },
};

/**
 * Observes GameState (house-changed, inventory-changed, outfit-changed) through its `stateObserver`,
 * and the Client of the house commands: it checks an action is valid, creates the command
 * and hands it to its CommandHistory.
 *
 * Decorating: the Decorate button shows the furniture buttons and changes the keys. A chosen item is
 * moved over the floor with the arrow keys and set down with Enter, or by choosing another item.
 * Any number of items can be placed; an item never replaces another one.
 */
export class HouseScene extends Phaser.Scene {
  /** Observer pattern, ConcreteObserver: the object attached to GameState. It hands every event to this scene. */
  private readonly stateObserver: Observer = { update: (event, data) => this.onStateEvent(event, data) };
  private history!: CommandHistory;
  private avatar!: PlayerAvatar;
  private room!: Phaser.GameObjects.Container;
  private hud!: Phaser.GameObjects.Container;
  private decorating = false;
  private carried: Carried | null = null;
  /** Set by observer events; the next frame redraws once, after the command and its history are settled. */
  private dirty = false;

  constructor() {
    super('HouseScene');
  }

  create(data: SpawnData): void {
    const { gameWidth: w, gameHeight: h } = config;
    const state = GameState.getInstance();
    this.decorating = false;
    this.carried = null;

    // The room itself looks the same day and night; only the window shows the time of day.
    this.add.image(0, 0, Assets.key('background', 'house')).setOrigin(0);
    this.createWindow(state.getPhase());
    this.add.tileSprite(0, FLOOR_TOP, w, h - FLOOR_TOP, Assets.key('ground', 'floor')).setOrigin(0);
    this.room = this.add.container(0, 0).setDepth(1);
    this.hud = this.add.container(0, 0).setDepth(20);

    this.physics.world.setBounds(0, FLOOR_TOP, w, h - FLOOR_TOP);
    this.avatar = new PlayerAvatar(this, data.spawnX ?? 480, data.spawnY ?? 400);
    addEntrance(this, this.avatar.sprite, 480, 504, 'box_exit', 'Exit', { targetScene: 'FarmScene', spawnX: RETURN_FROM_HOUSE.x, spawnY: RETURN_FROM_HOUSE.y });

    // Healing: entering the house restores the duck (placeholder for a bed or a meal).
    const duck = state.getDuck();
    duck.heal(duck.getMaxHp());

    // Items saved under a slot that is not a floor cell (an older save) are unlocked and taken off the floor.
    for (const [slot, itemId] of [...state.getPlacedItems()]) {
      if (parseCell(slot)) continue;
      state.setPlaced(slot, null);
      state.unlock(splitPlaced(itemId).id);
    }

    this.history = new CommandHistory();
    setHouseHistory(this.game, this.history);
    const lights = new HouseLights(this);
    state.attach(this.stateObserver);
    state.attach(lights);

    this.input.keyboard?.on('keydown-Z', () => this.undo());
    this.input.keyboard?.on('keydown-Y', () => this.redo());
    this.input.keyboard?.on('keydown', this.onKey, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      state.detach(this.stateObserver);
      state.detach(lights);
      this.history.clear();
      setHouseHistory(this.game, null);
    });

    this.redraw();
    fadeInScene(this);
  }

  /** Phaser's frame update. */
  update(): void {
    // While decorating, the keys move the furniture instead of the duck.
    this.avatar.update(isFading(this) || this.decorating);
    if (this.dirty) this.redraw();
  }

  /** The Observer's update, reached through `stateObserver`. */
  private onStateEvent(event: string, data?: unknown): void {
    if (event === 'phase-changed') this.showWindowPhase(data as Phase);
    if (event === 'house-changed' || event === 'inventory-changed' || event === 'outfit-changed') {
      this.dirty = true;
    }
  }

  /** Places an inventory item on a free floor cell. Returns whether a command ran. */
  placeItem(slot: string, itemId: string, rot = 0): boolean {
    const state = GameState.getInstance();
    const item = getItem(itemId);
    if (!item || !item.placeable) {
      toast(this, 'That cannot be placed.');
      return false;
    }
    if (!state.isUnlocked(itemId)) {
      toast(this, `${item.name} is not unlocked yet.`);
      return false;
    }
    if (!parseCell(slot) || BLOCKED.has(slot) || state.getPlaced(slot) !== null) {
      toast(this, 'That spot is taken.');
      return false;
    }
    this.history.run(new PlaceItemCommand(slot, joinPlaced(itemId, rot)));
    this.dirty = true;
    return true;
  }

  /** Takes the item on a cell back into the inventory. Returns whether a command ran. */
  removeItem(slot: string): boolean {
    if (GameState.getInstance().getPlaced(slot) === null) return false;
    this.history.run(new RemoveItemCommand(slot));
    this.dirty = true;
    return true;
  }

  undo(): void {
    if (isFading(this)) return;
    this.history.undo();
    this.dirty = true;
  }

  redo(): void {
    if (isFading(this)) return;
    this.history.redo();
    this.dirty = true;
  }

  // --- the window -------------------------------------------------------

  /** The glass of the window in the background picture (pixels). The night view is drawn over it. */
  private nightGlass!: Phaser.GameObjects.Container;

  private createWindow(phase: Phase): void {
    const left = 608;
    const top = 56;
    const width = 120;
    const height = 64;
    const night = this.add.container(0, 0).setDepth(0.5);
    night.add(this.add.rectangle(left, top, width, height, 0x0d1736, 1).setOrigin(0));
    night.add(this.add.rectangle(left, top + 24, width, 16, 0x1b2e5c, 1).setOrigin(0));
    night.add(this.add.rectangle(left, top + 40, width, 24, 0x25502f, 1).setOrigin(0)); // dark ground
    for (const [sx, sy] of [[12, 8], [30, 20], [52, 6], [70, 16], [92, 10], [108, 24], [20, 34], [84, 32]]) {
      night.add(this.add.rectangle(left + sx, top + sy, 3, 3, 0xf4f4f4, 1));
    }
    night.add(this.add.circle(left + 94, top + 20, 10, 0xf6e7b0, 1));
    night.add(this.add.circle(left + 89, top + 17, 9, 0x0d1736, 1)); // the crescent
    // The window bars stay in front of the night view.
    night.add(this.add.rectangle(left + 56, top, 8, height, 0x8a5f30, 1).setOrigin(0));
    night.add(this.add.rectangle(left, top + 28, width, 4, 0x8a5f30, 1).setOrigin(0));
    night.setAlpha(phase === 'night' ? 1 : 0);
    this.nightGlass = night;
  }

  /** Day or night came: the view through the window fades over one second. The room does not change. */
  private showWindowPhase(phase: Phase): void {
    this.tweens.killTweensOf(this.nightGlass);
    this.tweens.add({ targets: this.nightGlass, alpha: phase === 'night' ? 1 : 0, duration: config.skyTweenMs });
  }

  // --- decorating -----------------------------------------------------------

  private toggleDecorating(): void {
    if (this.decorating && this.carried && !this.setDown()) return;
    this.decorating = !this.decorating;
    this.carried = null;
    this.dirty = true;
  }

  /** A furniture button was pressed: the item in hand is set down first, then this one becomes active. */
  private pickFromInventory(itemId: string): void {
    if (this.carried?.itemId === itemId) return;
    if (this.carried && !this.setDown()) return;
    const start = this.freeCellNear(EXIT_COL, Math.floor(GRID.rows / 2));
    if (!start) {
      toast(this, 'The floor is full.');
      return;
    }
    this.carried = { itemId, ...start, rot: 0 };
    this.dirty = true;
  }

  /** A placed item was clicked: it goes back to the inventory and becomes the item in hand, where it stood. */
  private pickUpPlaced(slot: string): void {
    const cell = parseCell(slot);
    const value = GameState.getInstance().getPlaced(slot);
    if (!cell || value === null) return;
    if (this.carried && !this.setDown()) return;
    if (!this.removeItem(slot)) return;
    const { id, rot } = splitPlaced(value);
    this.carried = { itemId: id, ...cell, rot };
  }

  /** Fixes the item in hand on its cell. Fails (and keeps it in hand) when the cell is not free. */
  private setDown(): boolean {
    if (!this.carried) return true;
    if (!this.placeItem(cellId(this.carried.col, this.carried.row), this.carried.itemId, this.carried.rot)) return false;
    this.carried = null;
    return true;
  }

  /** Stops positioning the item in hand; it simply stays in the inventory. */
  private putAway(): void {
    this.carried = null;
    this.dirty = true;
  }

  private onKey(event: KeyboardEvent): void {
    if (!this.decorating || !this.carried || isFading(this)) return;
    const move = MOVE_KEYS[event.code];
    if (move) {
      event.preventDefault();
      this.carried.col = Phaser.Math.Clamp(this.carried.col + move.dx, 0, GRID.cols - 1);
      this.carried.row = Phaser.Math.Clamp(this.carried.row + move.dy, 0, GRID.rows - 1);
      this.dirty = true;
    } else if (event.code === 'KeyR') {
      // R turns the item in hand a quarter turn clockwise.
      this.carried.rot = (this.carried.rot + 1) % 4;
      this.dirty = true;
    } else if (event.code === 'Enter') {
      this.setDown();
      this.dirty = true;
    } else if (event.code === 'Backspace' || event.code === 'Delete') {
      this.putAway();
    }
  }

  private isFree(col: number, row: number): boolean {
    const id = cellId(col, row);
    return !BLOCKED.has(id) && GameState.getInstance().getPlaced(id) === null;
  }

  /** The free cell closest to the given one. */
  private freeCellNear(col: number, row: number): { col: number; row: number } | null {
    let best: { col: number; row: number } | null = null;
    let bestDistance = Infinity;
    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const distance = Math.abs(c - col) + Math.abs(r - row);
        if (distance < bestDistance && this.isFree(c, r)) {
          best = { col: c, row: r };
          bestDistance = distance;
        }
      }
    }
    return best;
  }

  // --- drawing --------------------------------------------------------------

  /** Redraws the placed items, the item in hand and the buttons. */
  private redraw(): void {
    const state = GameState.getInstance();
    this.dirty = false;
    if (this.carried && !state.isUnlocked(this.carried.itemId)) this.carried = null;

    this.room.removeAll(true);
    for (const [slot, value] of state.getPlacedItems()) {
      const cell = parseCell(slot);
      const { id, rot } = splitPlaced(value);
      if (!cell || !Assets.has('item', id)) continue;
      const { x, y } = cellCenter(cell.col, cell.row);
      const image = this.add.image(x, y, Assets.key('item', id)).setDisplaySize(GRID.cell, GRID.cell).setAngle(rot * 90);
      if (this.decorating) {
        image.setInteractive({ useHandCursor: true });
        image.on('pointerdown', () => this.pickUpPlaced(slot));
      }
      this.room.add(image);
    }
    if (this.carried) {
      const { x, y } = cellCenter(this.carried.col, this.carried.row);
      const free = this.isFree(this.carried.col, this.carried.row);
      this.room.add(this.add.rectangle(x, y, GRID.cell, GRID.cell, free ? 0x4cd137 : 0xd8343c, 0.3).setStrokeStyle(3, free ? 0x4cd137 : 0xd8343c, 1));
      if (Assets.has('item', this.carried.itemId)) {
        this.room.add(this.add.image(x, y, Assets.key('item', this.carried.itemId)).setDisplaySize(GRID.cell, GRID.cell).setAngle(this.carried.rot * 90).setAlpha(0.85));
      }
    }

    this.hud.removeAll(true);
    let x = 20;
    const add = (button: Phaser.GameObjects.Text): void => {
      this.hud.add(button);
      x += button.width + 8;
    };
    const hint = (y: number, text: string): void => {
      this.hud.add(this.add.text(20, y, text, { fontFamily: config.fontFamily, fontSize: '13px', color: '#ffffff', stroke: '#3a2a1a', strokeThickness: 3 }));
    };

    if (!this.decorating) {
      add(makeButton(this, x, 46, 'Decorate', () => this.toggleDecorating()));
      return;
    }

    add(makeButton(this, x, 46, 'Done', () => this.toggleDecorating()));
    const furniture = Object.values(ITEMS).filter((item) => item.placeable && state.isUnlocked(item.id));
    for (const item of furniture) {
      const selected = this.carried?.itemId === item.id;
      add(makeButton(this, x, 46, item.name, () => this.pickFromInventory(item.id), { selected }));
    }
    if (this.carried) add(makeButton(this, x, 46, 'Put away', () => this.putAway()));

    x = 20;
    add(makeButton(this, x, 84, 'Undo (Z)', () => this.undo(), { enabled: this.history.canUndo() }));
    add(makeButton(this, x, 84, 'Redo (Y)', () => this.redo(), { enabled: this.history.canRedo() }));
    hint(
      122,
      this.carried
        ? 'Arrow keys: move it     R: turn it     Enter or another item: set it down'
        : furniture.length > 0
          ? 'Choose a piece of furniture above (you can place as many as you like), or click one on the floor to move it'
          : 'No furniture yet. Talk to the animals on the farm to earn some',
    );
  }
}
