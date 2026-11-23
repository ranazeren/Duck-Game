import Phaser from 'phaser';
import { Audio } from '../assets/Audio';
import { config } from '../config';

export interface NavItem {
  /** What the colored frame is drawn around. */
  target: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.GetBounds;
  /** Runs when the player presses Enter or Space on it (or clicks the item). */
  activate(): void;
}

/**
 * How the arrow keys (and W A S D) move the focus:
 * vertical: Up / Down. horizontal: Left / Right. grid: Up and Left go back, Down and Right go forward.
 */
export type NavMode = 'vertical' | 'horizontal' | 'grid';

const BACK = new Set(['ArrowUp', 'KeyW', 'ArrowLeft', 'KeyA']);
const FORWARD = new Set(['ArrowDown', 'KeyS', 'ArrowRight', 'KeyD']);
const VERTICAL_KEYS = new Set(['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS']);
const HORIZONTAL_KEYS = new Set(['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD']);

/**
 * Plain helper (not a pattern): keyboard control for a menu. It keeps one focused item, draws a colored
 * frame around it, moves the focus with the arrow keys and activates it with Enter or Space.
 * (Activation happens when the key is released, so the same key press cannot also advance a conversation.)
 */
export class MenuNav {
  private readonly scene: Phaser.Scene;
  private readonly mode: NavMode;
  private readonly frame: Phaser.GameObjects.Graphics;
  private items: NavItem[] = [];
  private index = 0;

  constructor(scene: Phaser.Scene, mode: NavMode, depth: number) {
    this.scene = scene;
    this.mode = mode;
    this.frame = scene.add.graphics().setDepth(depth).setVisible(false);
    scene.input.keyboard?.on('keydown', this.onKeyDown, this);
    scene.input.keyboard?.on('keyup', this.onKeyUp, this);
  }

  /** Replaces the items; the focus starts on `focus`. An empty list switches the frame off. */
  setItems(items: NavItem[], focus = 0): void {
    this.items = items;
    this.index = Math.max(0, Math.min(focus, items.length - 1));
    items.forEach((item, i) => {
      // The mouse and the keyboard share one focus.
      item.target.on('pointerover', () => this.focus(i));
    });
    this.draw();
  }

  clear(): void {
    this.items = [];
    this.draw();
  }

  focusIndex(): number {
    return this.index;
  }

  focus(index: number): void {
    if (index === this.index || index < 0 || index >= this.items.length) return;
    this.index = index;
    this.draw();
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown', this.onKeyDown, this);
    this.scene.input.keyboard?.off('keyup', this.onKeyUp, this);
    this.frame.destroy();
    this.items = [];
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.items.length === 0) return;
    if (this.mode === 'vertical' && !VERTICAL_KEYS.has(event.code)) return;
    if (this.mode === 'horizontal' && !HORIZONTAL_KEYS.has(event.code)) return;
    const step = FORWARD.has(event.code) ? 1 : BACK.has(event.code) ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    this.index = (this.index + step + this.items.length) % this.items.length;
    Audio.play('sfx', 'click');
    this.draw();
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (this.items.length === 0) return;
    if (event.code !== 'Enter' && event.code !== 'Space') return;
    this.items[this.index]?.activate();
  }

  /** A thick colored frame around the focused item, so it is clear which one Enter will act on. */
  private draw(): void {
    this.frame.clear();
    const item = this.items[this.index];
    if (!item || !item.target.active) {
      this.frame.setVisible(false);
      return;
    }
    const bounds = item.target.getBounds();
    this.frame.lineStyle(4, Phaser.Display.Color.HexStringToColor(config.colors.focus).color, 1);
    this.frame.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
    this.frame.setVisible(true);
  }
}
