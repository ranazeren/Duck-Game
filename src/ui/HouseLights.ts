import Phaser from 'phaser';
import { cellCenter, parseCell } from '../content/houseGrid';
import { splitPlaced } from '../content/placement';
import { GameState, type Phase } from '../core/GameState';
import type { Observer } from '../core/Observer';

const BEAM_LENGTH = 190;
const BEAM_HALF_START = 9;
const BEAM_HALF_END = 78;
const BEAM_LAYERS = 5;
const DISCO_COLORS = [0xff5ea8, 0x5ec8ff, 0xffe45e, 0x7bff8a, 0xb07bff, 0xff9a5e];

/**
 * Observer pattern, ConcreteObserver of GameState (phase-changed, house-changed).
 * The house lights are on at night, and they come from the furniture: every lamp throws a cone of light
 * onto the floor in the direction it is turned (down when not turned), and every disco ball spins
 * colored beams. Nothing is drawn by day.
 */
export class HouseLights implements Observer {
  private readonly scene: Phaser.Scene;
  private readonly layer: Phaser.GameObjects.Container;
  private readonly spinners: Phaser.Tweens.Tween[] = [];
  private lightsOn: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layer = scene.add.container(0, 0).setDepth(6);
    this.lightsOn = GameState.getInstance().getPhase() === 'night';
    this.rebuild();
  }

  update(event: string, data?: unknown): void {
    if (event === 'phase-changed') {
      this.lightsOn = (data as Phase) === 'night';
      this.rebuild();
    } else if (event === 'house-changed') {
      this.rebuild();
    }
  }

  isOn(): boolean {
    return this.lightsOn;
  }

  /** Throws away the old lights and draws one set per lamp and disco ball that is placed. */
  private rebuild(): void {
    for (const tween of this.spinners) tween.stop();
    this.spinners.length = 0;
    this.layer.removeAll(true);
    if (!this.lightsOn) return;

    for (const [slot, value] of GameState.getInstance().getPlacedItems()) {
      const cell = parseCell(slot);
      if (!cell) continue;
      const { id, rot } = splitPlaced(value);
      const { x, y } = cellCenter(cell.col, cell.row);
      if (id === 'lamp') this.addLampBeam(x, y, rot);
      else if (id === 'disco_ball') this.addDiscoBeams(x, y);
    }
  }

  /** A cone of warm light, wide at the far end, with a flat pool of light where it lands. Turned with the lamp. */
  private addLampBeam(x: number, y: number, rot: number): void {
    const angle = Math.PI / 2 + (rot * Math.PI) / 2; // 0 turns: down; each turn is clockwise
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;

    const g = this.scene.add.graphics();
    // Layers from the widest and faintest to the narrowest and brightest make a soft edge.
    for (let i = 0; i < BEAM_LAYERS; i++) {
      const t = 1 - i / BEAM_LAYERS;
      const length = BEAM_LENGTH * (0.55 + 0.45 * t);
      const near = BEAM_HALF_START * (0.6 + 0.4 * t);
      const far = BEAM_HALF_END * t;
      g.fillStyle(0xffe9a6, 0.085);
      g.fillTriangle(x + px * near, y + py * near, x + dx * length + px * far, y + dy * length + py * far, x + dx * length - px * far, y + dy * length - py * far);
      g.fillTriangle(x + px * near, y + py * near, x - px * near, y - py * near, x + dx * length - px * far, y + dy * length - py * far);
    }
    this.layer.add(g);

    // The pool of light on the floor, a flat ellipse (the floor is seen at an angle).
    const poolX = x + dx * BEAM_LENGTH * 0.92;
    const poolY = y + dy * BEAM_LENGTH * 0.92;
    this.layer.add(this.scene.add.ellipse(poolX, poolY, BEAM_HALF_END * 2.1, BEAM_HALF_END * 0.8, 0xffe9a6, 0.22));
    this.layer.add(this.scene.add.ellipse(poolX, poolY, BEAM_HALF_END * 1.3, BEAM_HALF_END * 0.5, 0xfff6d0, 0.2));
    // A glow at the lamp itself.
    this.layer.add(this.scene.add.circle(x, y - 10, 12, 0xfff3c0, 0.45));
  }

  /** Colored beams that turn slowly around the ball, each ending in a small spot of light. */
  private addDiscoBeams(x: number, y: number): void {
    const spinner = this.scene.add.container(x, y);
    const count = DISCO_COLORS.length * 2;
    for (let i = 0; i < count; i++) {
      const color = DISCO_COLORS[i % DISCO_COLORS.length];
      const angle = (i / count) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const length = 150;
      const g = this.scene.add.graphics();
      g.fillStyle(color, 0.22);
      g.fillTriangle(0, 0, dx * length - dy * 10, dy * length + dx * 10, dx * length + dy * 10, dy * length - dx * 10);
      spinner.add(g);
      spinner.add(this.scene.add.ellipse(dx * (length + 6), dy * (length + 6) * 0.6, 26, 14, color, 0.55));
    }
    spinner.add(this.scene.add.circle(0, 0, 9, 0xffffff, 0.5));
    this.layer.add(spinner);
    this.spinners.push(this.scene.tweens.add({ targets: spinner, angle: 360, duration: 9000, repeat: -1 }));
  }
}
