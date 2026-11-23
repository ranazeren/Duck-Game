import Phaser from 'phaser';

export interface CritterOptions {
  /** Pixels per second while it moves. */
  speed: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** Rest between two walks, in milliseconds (min, max). */
  rest: [number, number];
  scale?: number;
  /** How far it goes in one walk. */
  reach?: number;
  /** A point it may not walk onto (a stump, a wagon). */
  blocked?: (x: number, y: number) => boolean;
}

/**
 * Plain helper (not a pattern): a little creature that wanders about for company (the forest squirrels and pigs).
 * It rests, walks to a nearby spot, hops a little as it goes, and turns to face where it is heading. It never collides.
 * The creatures are drawn facing left.
 */
export class Critter {
  readonly sprite: Phaser.GameObjects.Image;
  private readonly options: CritterOptions;
  private target: { x: number; y: number } | null = null;
  private rest: number;
  private hop = Math.random() * 6;

  constructor(scene: Phaser.Scene, key: string, x: number, y: number, options: CritterOptions) {
    this.options = options;
    this.sprite = scene.add.image(x, y, key).setOrigin(0.5, 0.9).setScale(options.scale ?? 1);
    this.rest = options.rest[0] + Math.random() * (options.rest[1] - options.rest[0]);
  }

  update(delta: number): void {
    const { sprite, options } = this;
    if (this.target) {
      const dx = this.target.x - sprite.x;
      const dy = this.target.y - sprite.y;
      const distance = Math.hypot(dx, dy);
      const step = (options.speed * delta) / 1000;
      if (distance <= step) {
        this.target = null;
        this.rest = options.rest[0] + Math.random() * (options.rest[1] - options.rest[0]);
      } else {
        sprite.x += (dx / distance) * step;
        sprite.y += (dy / distance) * step;
        sprite.setFlipX(dx > 0);
        this.hop += delta / 90;
      }
    } else {
      this.rest -= delta;
      if (this.rest <= 0) this.target = this.pickTarget();
    }
    // a little hop while it moves
    sprite.setDisplayOrigin(sprite.width / 2, sprite.height * 0.9 + (this.target ? Math.abs(Math.sin(this.hop)) * 4 : 0));
    sprite.setDepth(2 + sprite.y / 200);
  }

  private pickTarget(): { x: number; y: number } | null {
    const { bounds, reach = 110, blocked } = this.options;
    for (let tries = 0; tries < 10; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 30 + Math.random() * reach;
      const x = Phaser.Math.Clamp(this.sprite.x + Math.cos(angle) * length, bounds.minX, bounds.maxX);
      const y = Phaser.Math.Clamp(this.sprite.y + Math.sin(angle) * length * 0.6, bounds.minY, bounds.maxY);
      if (blocked && blocked(x, y)) continue;
      return { x, y };
    }
    this.rest = 800;
    return null;
  }
}
