import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { Audio } from '../assets/Audio';
import { config } from '../config';
import { RETURN_FROM_SHOP } from '../content/farmLayout';
import { getItem, outfitSummary } from '../content/items';
import { SHOP_CATEGORIES, SHOP_CATEGORY_LABEL, buy, isOwned, shopEntries, type ShopCategory, type ShopEntry } from '../content/shop';
import { GameState } from '../core/GameState';
import { makeButton } from '../ui/Button';
import { addBackground, fadeInScene, isFading, toast, transitionTo } from './sceneHelpers';

const C = config.shopColors;
const hex = (color: string): number => Phaser.Display.Color.HexStringToColor(color).color;

const PANEL_X = 90;
const PANEL_Y = 112;
const PANEL_W = 780;
const PANEL_H = 366;
const LIST_X = PANEL_X + 24;
const LIST_Y = PANEL_Y + 62;
const ROW_HEIGHT = 52;
const ROW_WIDTH = PANEL_W - 48;

/**
 * Plain scene (no pattern): the shop, a wooden market shop under a teal tiled roof. Outfits, furniture and food
 * are bought with coins. Keys: Left / Right change the category, Up / Down choose, Enter buys, Backspace leaves.
 * (Plain content and rules live in content/shop.ts.)
 */
export class ShopScene extends Phaser.Scene {
  private category: ShopCategory = 'outfit';
  private cursor = 0;
  private ui!: Phaser.GameObjects.Container;
  private lastClick = { row: -1, time: 0 };

  constructor() {
    super('ShopScene');
  }

  create(): void {
    this.category = 'outfit';
    this.cursor = 0;
    this.lastClick = { row: -1, time: 0 };

    addBackground(this, 'farm');
    this.add.rectangle(0, 0, config.gameWidth, config.gameHeight, 0x000000, 0.55).setOrigin(0).setDepth(1);
    this.drawAwning();
    this.ui = this.add.container(0, 0).setDepth(2);

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-LEFT', () => this.changeCategory(-1));
    keyboard?.on('keydown-A', () => this.changeCategory(-1));
    keyboard?.on('keydown-RIGHT', () => this.changeCategory(1));
    keyboard?.on('keydown-D', () => this.changeCategory(1));
    keyboard?.on('keydown-UP', () => this.moveCursor(-1));
    keyboard?.on('keydown-W', () => this.moveCursor(-1));
    keyboard?.on('keydown-DOWN', () => this.moveCursor(1));
    keyboard?.on('keydown-S', () => this.moveCursor(1));
    keyboard?.on('keydown-ENTER', () => this.buySelected());
    keyboard?.on('keydown-BACKSPACE', () => this.leave());

    this.redraw();
    fadeInScene(this);
  }

  /** The teal tiled roof across the top (like the shop on the farm), with a wooden beam, a hanging lantern and the sign. */
  private drawAwning(): void {
    const g = this.add.graphics().setDepth(1.5);
    const shades = [0x1f8f86, 0x26a69a, 0x157a72];
    for (let row = 0; row < 3; row++) {
      for (let i = -1; i * 40 < config.gameWidth + 40; i++) {
        const x = i * 40 + (row % 2) * 20;
        g.fillStyle(shades[(i + row + 3) % 3], 1);
        g.fillRoundedRect(x, row * 17 - 8, 42, 26, 9);
        g.lineStyle(2, 0x0f5b55, 1);
        g.strokeRoundedRect(x, row * 17 - 8, 42, 26, 9);
      }
    }
    g.fillStyle(0x8a5a2b, 1);
    g.fillRect(0, 50, config.gameWidth, 10);
    g.fillStyle(0x5a3a1e, 1);
    g.fillRect(0, 58, config.gameWidth, 3);
    // the hanging lantern, with a warm glow
    this.add.circle(86, 96, 26, 0xffd86b, 0.18).setDepth(1.5);
    g.fillStyle(0x3a2616, 1);
    g.fillRect(84, 60, 3, 18);
    g.fillRect(76, 78, 19, 4);
    g.fillStyle(0xffd86b, 1);
    g.fillRect(78, 82, 15, 16);
    g.lineStyle(2, 0x3a2616, 1);
    g.strokeRect(78, 82, 15, 16);
    // the wooden sign
    this.add.rectangle(config.gameWidth / 2, 82, 300, 40, 0x6b4420, 1).setStrokeStyle(4, 0x2a1c10, 1).setDepth(1.6);
    this.add
      .text(config.gameWidth / 2, 82, 'THE SHOP', { fontFamily: config.fontFamily, fontSize: '24px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(1.7);
  }

  private entries(): ShopEntry[] {
    return shopEntries(this.category);
  }

  private changeCategory(step: number): void {
    if (isFading(this)) return;
    const index = SHOP_CATEGORIES.indexOf(this.category);
    this.setCategory(SHOP_CATEGORIES[(index + step + SHOP_CATEGORIES.length) % SHOP_CATEGORIES.length]);
  }

  private setCategory(category: ShopCategory): void {
    this.category = category;
    this.cursor = 0;
    Audio.play('sfx', 'click');
    this.redraw();
  }

  private moveCursor(step: number): void {
    if (isFading(this)) return;
    const count = this.entries().length;
    if (count === 0) return;
    this.cursor = (this.cursor + step + count) % count;
    Audio.play('sfx', 'click');
    this.redraw();
  }

  private buySelected(): void {
    const entry = this.entries()[this.cursor];
    if (!entry || isFading(this)) return;
    const name = getItem(entry.id)?.name ?? entry.id;
    const result = buy(entry);
    if (result === 'bought') toast(this, `Bought ${name} for ${entry.price} coins.`);
    else if (result === 'poor') toast(this, `Not enough coins for ${name}.`);
    else toast(this, `You already have ${name}.`);
    Audio.play('sfx', result === 'bought' ? 'hit' : 'click');
    this.redraw();
  }

  private leave(): void {
    if (isFading(this)) return;
    transitionTo(this, 'FarmScene', { spawnX: RETURN_FROM_SHOP.x, spawnY: RETURN_FROM_SHOP.y });
  }

  private redraw(): void {
    this.ui.removeAll(true);
    const state = GameState.getInstance();
    const font = config.fontFamily;
    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.ui.add(object);
      return object;
    };
    const label = (x: number, y: number, text: string, size: number, color: string, bold = false): Phaser.GameObjects.Text =>
      add(this.add.text(x, y, text, { fontFamily: font, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal' }));

    // The wooden shop counter panel.
    add(this.add.rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, hex(C.panel), 0.96).setOrigin(0).setStrokeStyle(5, 0xc49a5c, 1));

    // Your coins, top right of the panel.
    add(this.add.image(PANEL_X + PANEL_W - 190, PANEL_Y + 26, Assets.key('ui', 'piggy')).setScale(1.1));
    add(this.add.image(PANEL_X + PANEL_W - 140, PANEL_Y + 28, Assets.key('ui', 'coin')));
    label(PANEL_X + PANEL_W - 120, PANEL_Y + 14, `${state.getCoins()}`, 22, C.accent, true);

    // Category tabs.
    let tabX = LIST_X;
    for (const category of SHOP_CATEGORIES) {
      const tab = makeButton(this, tabX, PANEL_Y + 14, SHOP_CATEGORY_LABEL[category], () => this.setCategory(category), {
        fontSize: 18,
        selected: category === this.category,
      });
      add(tab);
      tabX += tab.width + 12;
    }

    this.entries().forEach((entry, row) => {
      const y = LIST_Y + row * ROW_HEIGHT;
      const item = getItem(entry.id);
      const owned = isOwned(entry);
      const selected = row === this.cursor;

      const back = add(
        this.add
          .rectangle(LIST_X, y, ROW_WIDTH, ROW_HEIGHT - 6, hex(selected ? C.rowSelected : C.row), 1)
          .setOrigin(0)
          .setStrokeStyle(selected ? 3 : 1, selected ? hex(C.accent) : 0xc49a5c, selected ? 1 : 0.6),
      );
      back.setInteractive({ useHandCursor: true });
      back.on('pointerdown', () => {
        // One click chooses a row, a second click on it buys.
        const now = this.time.now;
        const again = this.lastClick.row === row && now - this.lastClick.time < 600;
        this.lastClick = { row, time: now };
        this.cursor = row;
        if (again) this.buySelected();
        else this.redraw();
      });

      add(this.add.rectangle(LIST_X + 26, y + 20, 38, 38, 0xf2deb0, 1).setStrokeStyle(2, 0x2a1c10, 1));
      if (Assets.has('item', entry.id)) add(this.add.image(LIST_X + 26, y + 20, Assets.key('item', entry.id)).setScale(1.2));
      label(LIST_X + 58, y + 3, item?.name ?? entry.id, 18, C.text, true);
      const detail = entry.category === 'outfit' ? outfitSummary(entry.id) : entry.category === 'furniture' ? 'Place as many as you like' : (item?.description ?? '');
      label(LIST_X + 58, y + 25, detail, 14, C.muted);

      // The price (with a coin), or "Owned".
      if (owned) {
        label(LIST_X + ROW_WIDTH - 20, y + 12, 'Owned', 18, C.good, true).setOrigin(1, 0);
      } else {
        const price = label(LIST_X + ROW_WIDTH - 20, y + 12, `${entry.price}`, 20, C.accent, true).setOrigin(1, 0);
        add(this.add.image(price.x - price.width - 16, y + 22, Assets.key('ui', 'coin')));
      }
    });

    add(makeButton(this, PANEL_X + PANEL_W - 230, PANEL_Y + PANEL_H - 44, 'Leave (Backspace)', () => this.leave(), { fontSize: 16 }));
    label(LIST_X, PANEL_Y + PANEL_H - 36, 'Left / Right: category     Up / Down: choose     Enter: buy', 14, C.muted);
  }
}
