import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { config } from '../config';
import { isOpenWater, randomWaterPoint } from '../content/pondMap';
import { defaultRng } from '../core/Rng';
import type { WaterEffects } from './WaterEffects';

const SPEED = 22; // pixels per second
const HIDDEN_PX = 9; // the lower part of the frog is under the water
const SAY_COOLDOWN_MS = 5000;

/**
 * Plain helper (not a pattern): a frog in a cowboy hat that swims about the pond for company.
 * It paddles to a spot of open water, rests, then paddles on, leaves ripples, and says "Ribbit!" when the duck swims by.
 */
export class PondFrog {
  private readonly scene: Phaser.Scene;
  private readonly wake: WaterEffects;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly bubble: Phaser.GameObjects.Text;
  private target: { x: number; y: number } | null = null;
  private rest = 1500;
  private lastSay = -SAY_COOLDOWN_MS;
  private lastRipple = 0;
  private bob = Math.random() * 6;

  constructor(scene: Phaser.Scene, wake: WaterEffects) {
    this.scene = scene;
    this.wake = wake;
    const start = randomWaterPoint(defaultRng) ?? { x: 480, y: 420 };
    this.sprite = scene.add.image(start.x, start.y, Assets.key('animal', 'frog')).setDepth(8);
    this.sprite.setCrop(0, 0, this.sprite.width, this.sprite.height - HIDDEN_PX);
    this.bubble = scene.add
      .text(start.x, start.y - 40, 'Ribbit!', {
        fontFamily: config.fontFamily,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(13)
      .setAlpha(0);
  }

  update(time: number, delta: number, duckX: number, duckY: number): void {
    const frog = this.sprite;
    if (this.target) {
      const dx = this.target.x - frog.x;
      const dy = this.target.y - frog.y;
      const distance = Math.hypot(dx, dy);
      const step = (SPEED * delta) / 1000;
      if (distance <= step) {
        this.target = null;
        this.rest = 1800 + Math.random() * 3500;
      } else {
        frog.x += (dx / distance) * step;
        frog.y += (dy / distance) * step;
        frog.setFlipX(dx < 0);
        if (time - this.lastRipple > 110) {
          this.lastRipple = time;
          this.wake.emit(time, frog.x, frog.y + 14);
        }
      }
    } else {
      this.rest -= delta;
      if (this.rest <= 0) this.target = this.pickTarget();
      else if (time - this.lastRipple > 1400) {
        this.lastRipple = time;
        this.wake.emit(time, frog.x, frog.y + 14);
      }
    }

    // It bobs gently on the water.
    this.bob += delta / 300;
    const bobY = Math.sin(this.bob) * 2;
    frog.setDisplayOrigin(frog.width / 2, frog.height / 2 - bobY);

    this.bubble.setPosition(frog.x, frog.y - 34);
    if (Math.hypot(duckX - frog.x, duckY - frog.y) < 56 && time - this.lastSay > SAY_COOLDOWN_MS) {
      this.lastSay = time;
      this.bubble.setAlpha(1);
      this.scene.tweens.add({ targets: this.bubble, alpha: 0, delay: 900, duration: 500 });
    }
  }

  /** A nearby spot of open water that can be reached in a straight line. */
  private pickTarget(): { x: number; y: number } | null {
    for (let tries = 0; tries < 12; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 60 + Math.random() * 140;
      const x = this.sprite.x + Math.cos(angle) * length;
      const y = this.sprite.y + Math.sin(angle) * length;
      if (!isOpenWater(x, y) || !isOpenWater((x + this.sprite.x) / 2, (y + this.sprite.y) / 2)) continue;
      return { x, y };
    }
    this.rest = 1200;
    return null;
  }
}
