import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { Audio } from '../assets/Audio';
import { config } from '../config';
import { getItem, ITEMS, outfitSummary } from '../content/items';
import { GameState } from '../core/GameState';
import type { Observer } from '../core/Observer';
import type { CommandHistory } from '../patterns/command/CommandHistory';
import { EquipOutfitCommand } from '../patterns/command/EquipOutfitCommand';

export interface InventoryPanelHooks {
  /** The house's history while in the house, else null (the command then runs directly). */
  activeHistory(): CommandHistory | null;
  /** Equipping is disabled while a battle exists. */
  inBattle(): boolean;
  toast(message: string): void;
  /** True while something else owns the keyboard (a conversation). */
  blocked(): boolean;
  /** The screen opened or closed; the game stands still while it is open. */
  onToggle(open: boolean): void;
}

const TOP = 36;
const LIST_X = 500;
const LIST_Y = 104;
const ROW_HEIGHT = 46;
const ROW_WIDTH = 420;
const DUCK_X = 240;
const DUCK_Y = 250;
const DUCK_SCALE = 6;

const COLORS = config.colors;
/** Two clicks on a row within this many milliseconds count as a double click. */
const DOUBLE_CLICK_MS = 380;

/**
 * Observer pattern, ConcreteObserver of GameState (inventory-changed, coins-changed, outfit-changed).
 * Shows the coin counter and the inventory screen: a large duck wearing its outfits, the item list,
 * each outfit's attack bonus and the total. While the screen is open the keys change:
 * Up / Down choose an item and E wears or takes off the chosen outfit.
 */
export class InventoryPanel implements Observer {
  private readonly scene: Phaser.Scene;
  private readonly hooks: InventoryPanelHooks;
  private readonly coinText: Phaser.GameObjects.Text;
  private readonly panel: Phaser.GameObjects.Container;
  private open = false;
  private cursor = 0;
  private lastClick = { row: -1, time: 0 };

  constructor(scene: Phaser.Scene, hooks: InventoryPanelHooks) {
    this.scene = scene;
    this.hooks = hooks;
    const state = GameState.getInstance();

    scene.add.image(150, 18, Assets.key('ui', 'coin'));
    this.coinText = scene.add
      .text(168, 18, String(state.getCoins()), { fontFamily: config.fontFamily, fontSize: '18px', fontStyle: 'bold', color: COLORS.accent })
      .setOrigin(0, 0.5);

    const button = scene.add.image(config.gameWidth - 22, 18, Assets.key('ui', 'inventory'));
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.toggle());
    scene.add
      .text(config.gameWidth - 40, 18, 'Inventory (I)', { fontFamily: config.fontFamily, fontSize: '14px', color: '#ffffff' })
      .setOrigin(1, 0.5);

    const keyboard = scene.input.keyboard;
    keyboard?.on('keydown-I', () => this.toggle());
    keyboard?.on('keydown-UP', () => this.moveCursor(-1));
    keyboard?.on('keydown-W', () => this.moveCursor(-1));
    keyboard?.on('keydown-DOWN', () => this.moveCursor(1));
    keyboard?.on('keydown-S', () => this.moveCursor(1));
    keyboard?.on('keydown-E', () => this.useSelected());

    this.panel = scene.add.container(0, 0).setDepth(50).setVisible(false);
  }

  update(event: string, data?: unknown): void {
    if (event === 'coins-changed') this.coinText.setText(String(data as number));
    if (event === 'inventory-changed' || event === 'outfit-changed') this.redraw();
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    if (!this.open && this.hooks.blocked()) return;
    this.open = !this.open;
    this.panel.setVisible(this.open);
    this.hooks.onToggle(this.open);
    this.redraw();
  }

  /**
   * Inventory rows in the order of the items table, so they do not jump around.
   * Unlocked furniture comes last with the count -1: it is never used up.
   */
  private entries(): Array<[string, number]> {
    const state = GameState.getInstance();
    const order = Object.keys(ITEMS);
    const rank = (id: string): number => order.indexOf(id) + 1 || order.length + 1;
    const owned = [...state.getInventory().entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
    const furniture = state
      .getUnlocked()
      .slice()
      .sort((a, b) => rank(a) - rank(b))
      .map((id): [string, number] => [id, -1]);
    return [...owned, ...furniture];
  }

  private moveCursor(step: number): void {
    if (!this.open) return;
    const count = this.entries().length;
    if (count === 0) return;
    this.cursor = (this.cursor + step + count) % count;
    Audio.play('sfx', 'click');
    this.redraw();
  }

  /** E: wears or takes off the chosen outfit. */
  private useSelected(): void {
    if (!this.open) return;
    const entry = this.entries()[this.cursor];
    if (!entry) return;
    const item = getItem(entry[0]);
    if (item?.kind !== 'outfit') {
      this.hooks.toast(item?.kind === 'furniture' ? 'Furniture is placed in the house.' : 'Only outfits can be worn.');
      return;
    }
    this.toggleOutfit(item.id);
  }

  /** Client of EquipOutfitCommand: through the house history if one exists, otherwise a one-off run. */
  private toggleOutfit(outfitId: string): void {
    if (this.hooks.inBattle()) {
      this.hooks.toast('Outfits cannot be changed during a battle.');
      return;
    }
    if (GameState.getInstance().countOf(outfitId) <= 0) return;
    Audio.play('sfx', 'click');
    const command = new EquipOutfitCommand(outfitId);
    const history = this.hooks.activeHistory();
    if (history) history.run(command);
    else command.execute();
  }

  private redraw(): void {
    this.panel.removeAll(true);
    if (!this.open) return;
    const state = GameState.getInstance();
    const duck = state.getDuck();
    const equipped = state.getEquipped();
    const entries = this.entries();
    this.cursor = Math.max(0, Math.min(this.cursor, entries.length - 1));

    const font = config.fontFamily;
    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.panel.add(object);
      return object;
    };
    const label = (x: number, y: number, text: string, size: number, color: string = COLORS.text, bold = false): Phaser.GameObjects.Text =>
      add(this.scene.add.text(x, y, text, { fontFamily: font, fontSize: `${Math.max(size, 14)}px`, color, fontStyle: bold ? 'bold' : 'normal' }));

    add(this.scene.add.rectangle(0, TOP, config.gameWidth, config.gameHeight - TOP, 0x10131c, 0.97).setOrigin(0));
    label(40, 52, 'Inventory', 26, '#ffffff', true);

    // The duck, large, wearing everything it has on (the decorator chain's sprite stack).
    add(this.scene.add.ellipse(DUCK_X, DUCK_Y + 132, 250, 44, 0x000000, 0.35));
    for (const key of duck.getSprites()) add(this.scene.add.image(DUCK_X, DUCK_Y, key).setScale(DUCK_SCALE));

    // Attack: what each worn outfit adds, and the total.
    const base = config.duck.attack;
    const total = duck.getAttack();
    let y = 388;
    label(60, y, `HP  ${duck.getHp()} / ${duck.getMaxHp()}`, 16, COLORS.textMuted);
    label(250, y, `Base attack  ${base}`, 16, COLORS.textMuted);
    y += 26;
    const worn = equipped.map((id) => getItem(id)?.name ?? id);
    label(60, y, worn.length > 0 ? `Wearing:  ${worn.join(',  ')}` : 'Wearing:  nothing', 16);
    y += 28;
    label(60, y, `Outfit bonus  +${total - base}`, 18, COLORS.good, true);
    label(250, y, `Total attack  ${total}`, 18, COLORS.accent, true);
    y += 28;
    const move = duck.getMoveSpeed();
    const attackSpeed = duck.getAttackSpeed();
    label(60, y, `Move speed  ${move}  (+${move - config.playerSpeed})`, 17, COLORS.accent, true);
    label(250, y, `Attack speed  ${attackSpeed}  (+${attackSpeed - config.duck.attackSpeed})`, 17, COLORS.accent, true);

    // The item list. The highlighted row is the one E acts on.
    if (entries.length === 0) label(LIST_X, LIST_Y, '(empty)', 16, COLORS.textMuted);
    entries.forEach(([id, count], row) => {
      const rowY = LIST_Y + row * ROW_HEIGHT;
      const item = getItem(id);
      const isWorn = equipped.includes(id);
      const selected = row === this.cursor;

      const back = add(
        this.scene.add
          .rectangle(LIST_X - 10, rowY, ROW_WIDTH, ROW_HEIGHT - 6, selected ? 0x2d4a7a : 0x1b2030, 1)
          .setOrigin(0)
          .setStrokeStyle(2, selected ? 0xffe066 : 0x2a3350, 1),
      );
      back.setInteractive({ useHandCursor: true });
      back.on('pointerdown', () => {
        // One click chooses the row; a double click on an outfit wears or takes it off.
        const now = this.scene.time.now;
        const isDouble = this.lastClick.row === row && now - this.lastClick.time < DOUBLE_CLICK_MS;
        this.lastClick = { row, time: isDouble ? 0 : now };
        this.cursor = row;
        if (isDouble && item?.kind === 'outfit') this.toggleOutfit(id);
        else this.redraw();
      });

      // A light tile behind the icon keeps dark outlines readable on the dark panel.
      add(this.scene.add.rectangle(LIST_X + 12, rowY + 20, 32, 32, 0xcfd8e6, 1));
      if (Assets.has('item', id)) add(this.scene.add.image(LIST_X + 12, rowY + 20, Assets.key('item', id)));
      label(LIST_X + 40, rowY + 2, `${item?.name ?? id}  ${count < 0 ? '(unlocked)' : `x${count}`}`, 16, isWorn ? COLORS.good : COLORS.text, true);

      const detail =
        item?.kind === 'outfit'
          ? `${outfitSummary(id)}${isWorn ? '  ·  wearing' : ''}  ·  E or double-click`
          : item?.kind === 'furniture'
            ? 'Place it in the house as often as you like'
            : (item?.description ?? '');
      label(LIST_X + 40, rowY + 22, detail, 13, item?.kind === 'outfit' ? COLORS.accent : COLORS.textMuted);
    });

    add(
      this.scene.add
        .text(config.gameWidth / 2, config.gameHeight - 14, 'Up / Down:  choose        E:  wear or take off        I:  close', {
          fontFamily: font,
          fontSize: '14px',
          color: COLORS.textMuted,
        })
        .setOrigin(0.5, 1),
    );
  }
}
