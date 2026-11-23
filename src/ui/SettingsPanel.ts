import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { Audio } from '../assets/Audio';
import { config } from '../config';
import { makeButton } from './Button';
import { MenuNav, type NavItem } from './MenuNav';

export interface SettingsHooks {
  save(): void;
  exit(): void;
  /** Takes the duck home (the house): the way out when it is stuck. */
  goHome(): void;
  togglePause(): void;
  isPaused(): boolean;
  /** The menu opened or closed; the game stands still while it is open. */
  onToggle(open: boolean): void;
}

const WIDTH = 400;
const HEIGHT = 446;
const TRACK_WIDTH = 280;
const TRACK_X = (WIDTH - TRACK_WIDTH) / 2;
const TRACK_Y = 318;
const CLOSE_SIZE = 40;
const COLORS = config.colors;

/**
 * Plain UI class (not a pattern): the settings menu with Save, Pause, a volume slider and Exit.
 * It is mostly see-through; every piece of text sits on its own solid chip so it stays readable (WCAG AA).
 * Keyboard: Up / Down (or W / S) move the colored frame, Enter or Space activates, Left / Right change the
 * volume by 1 (with Shift by 10), Esc closes.
 */
export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly hooks: SettingsHooks;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly nav: MenuNav;
  private open = false;
  private dragging = false;
  private volumeLabel: Phaser.GameObjects.Text | null = null;
  private volumeFill: Phaser.GameObjects.Rectangle | null = null;
  private volumeKnob: Phaser.GameObjects.Arc | null = null;

  constructor(scene: Phaser.Scene, hooks: SettingsHooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.panel = scene.add
      .container((config.gameWidth - WIDTH) / 2, (config.gameHeight - HEIGHT) / 2 + 22)
      .setDepth(60)
      .setVisible(false);
    this.nav = new MenuNav(scene, 'vertical', 70);

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && pointer.isDown) this.setVolumeFromPointer(pointer);
    });
    scene.input.on('pointerup', () => {
      if (!this.dragging) return;
      this.dragging = false;
      Audio.play('sfx', 'click'); // lets the player hear the new level
    });
    scene.input.keyboard?.on('keydown-LEFT', (event: KeyboardEvent) => this.nudge(-1, event));
    scene.input.keyboard?.on('keydown-RIGHT', (event: KeyboardEvent) => this.nudge(1, event));
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    this.setOpen(!this.open);
  }

  close(): void {
    this.setOpen(false);
  }

  private setOpen(open: boolean): void {
    if (open === this.open) return;
    this.open = open;
    this.refresh();
    this.hooks.onToggle(open);
  }

  /** Redraws the menu; call it when something it shows (the pause state) changed elsewhere. */
  refresh(): void {
    const keepFocus = this.nav.focusIndex();
    this.panel.removeAll(true);
    this.panel.setVisible(this.open);
    this.dragging = false;
    this.volumeLabel = null;
    this.volumeFill = null;
    this.volumeKnob = null;
    this.nav.clear();
    if (!this.open) return;

    const centerX = WIDTH / 2;
    const add = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.panel.add(object);
      return object;
    };
    const items: NavItem[] = [];
    const button = (y: number, label: string, onClick: () => void): void => {
      const text = add(makeButton(this.scene, centerX, y, label, onClick, { fontSize: 22 }).setOrigin(0.5, 0));
      items.push({ target: text, activate: onClick });
    };

    // Duck-patterned backdrop, mostly see-through, with a frame.
    add(this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x10131c, 0.3).setOrigin(0));
    add(this.scene.add.tileSprite(0, 0, WIDTH, HEIGHT, Assets.key('ui', 'duck_pattern')).setOrigin(0).setAlpha(0.45));
    add(this.scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0).setOrigin(0).setStrokeStyle(3, 0xffffff, 0.9));

    // A gear picture as the title, no text.
    add(this.scene.add.image(centerX, 48, Assets.key('ui', 'gear')).setScale(1.9));

    const close = this.addCloseCross(add, WIDTH - CLOSE_SIZE / 2 - 8, CLOSE_SIZE / 2 + 8);

    button(104, 'Save game', () => this.hooks.save());
    button(160, this.hooks.isPaused() ? 'Resume' : 'Pause', () => this.hooks.togglePause());
    button(216, 'Go home', () => this.hooks.goHome());

    // Volume slider: one continuous bar, 0 to 100 in steps of 1. Click or drag anywhere on it.
    this.volumeLabel = add(
      this.scene.add
        .text(centerX, 264, '', {
          fontFamily: config.fontFamily,
          fontSize: '22px',
          fontStyle: 'bold',
          color: COLORS.text,
          backgroundColor: '#000000',
          padding: { x: 14, y: 5 },
        })
        .setOrigin(0.5, 0),
    );
    const track = add(this.scene.add.rectangle(TRACK_X, TRACK_Y, TRACK_WIDTH, 14, 0x10131c, 1).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 1));
    this.volumeFill = add(this.scene.add.rectangle(TRACK_X, TRACK_Y, TRACK_WIDTH, 14, 0x4cd137, 1).setOrigin(0, 0.5));
    this.volumeKnob = add(this.scene.add.circle(TRACK_X, TRACK_Y, 13, 0xffffff, 1).setStrokeStyle(3, 0x10131c, 1));
    const grab = add(this.scene.add.rectangle(TRACK_X - 14, TRACK_Y, TRACK_WIDTH + 28, 40, 0x000000, 0).setOrigin(0, 0.5));
    grab.setInteractive({ useHandCursor: true });
    grab.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.setVolumeFromPointer(pointer);
    });
    items.push({ target: track, activate: () => undefined }); // the slider is changed with Left / Right
    this.showVolume();

    button(364, 'Exit', () => this.hooks.exit());
    items.push(close);

    this.nav.setItems(items, Math.min(keepFocus, items.length - 1));
  }

  private addCloseCross(add: <T extends Phaser.GameObjects.GameObject>(object: T) => T, cx: number, cy: number): NavItem {
    const half = CLOSE_SIZE / 2;
    const back = add(this.scene.add.rectangle(cx, cy, CLOSE_SIZE, CLOSE_SIZE, 0x000000, 1).setStrokeStyle(2, 0xffffff, 1));
    const cross = add(this.scene.add.graphics());
    cross.lineStyle(4, 0xffffff, 1);
    cross.lineBetween(cx - half + 11, cy - half + 11, cx + half - 11, cy + half - 11);
    cross.lineBetween(cx + half - 11, cy - half + 11, cx - half + 11, cy + half - 11);
    const activate = (): void => {
      Audio.play('sfx', 'click');
      this.close();
    };
    back.setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setFillStyle(0x262626, 1));
    back.on('pointerout', () => back.setFillStyle(0x000000, 1));
    back.on('pointerdown', activate);
    return { target: back, activate };
  }

  private nudge(direction: number, event: KeyboardEvent): void {
    if (!this.open) return;
    event.preventDefault();
    Audio.setVolume(Audio.getVolume() + (direction * (event.shiftKey ? 10 : 1)) / 100);
    this.showVolume();
  }

  private setVolumeFromPointer(pointer: Phaser.Input.Pointer): void {
    const local = pointer.x - this.panel.x - TRACK_X;
    Audio.setVolume(Math.round(Phaser.Math.Clamp(local / TRACK_WIDTH, 0, 1) * 100) / 100);
    this.showVolume();
  }

  private showVolume(): void {
    const percent = Math.round(Audio.getVolume() * 100);
    const width = (TRACK_WIDTH * percent) / 100;
    this.volumeLabel?.setText(`Volume  ${percent}`);
    this.volumeFill?.setDisplaySize(Math.max(0.001, width), 14);
    this.volumeKnob?.setPosition(TRACK_X + width, TRACK_Y);
  }
}
