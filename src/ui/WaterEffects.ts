import Phaser from 'phaser';

/**
 * Plain helper (not a pattern): the wake a swimmer leaves behind. Each call to `emit` adds a flat ripple
 * that spreads and fades on the water surface, and now and then a bubble that floats up. Everything
 * destroys itself when its tween ends, so nothing piles up.
 */
export class WaterEffects {
  private readonly scene: Phaser.Scene;
  private readonly depth: number;
  private lastEmit = 0;

  constructor(scene: Phaser.Scene, depth = 5) {
    this.scene = scene;
    this.depth = depth;
  }

  /** Leaves a wake at the swimmer's waterline. Throttled, so it can be called every frame. */
  emit(time: number, x: number, y: number): void {
    if (time - this.lastEmit < 110) return;
    this.lastEmit = time;
    const scene = this.scene;

    const ripple = scene.add.ellipse(x, y, 14, 5, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0.85).setDepth(this.depth);
    scene.tweens.add({
      targets: ripple,
      scaleX: 3.2,
      scaleY: 2.4,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeOut',
      onComplete: () => ripple.destroy(),
    });

    if (Math.random() < 0.55) {
      const radius = 2 + Math.random() * 2.5;
      const bubble = scene.add
        .circle(x + (Math.random() - 0.5) * 22, y + 2, radius, 0xdff4ff, 0.35)
        .setStrokeStyle(1, 0xffffff, 0.95)
        .setDepth(this.depth + 1);
      scene.tweens.add({
        targets: bubble,
        y: bubble.y - 16 - Math.random() * 14,
        x: bubble.x + (Math.random() - 0.5) * 8,
        alpha: 0,
        duration: 700 + Math.random() * 500,
        ease: 'Sine.easeOut',
        onComplete: () => bubble.destroy(),
      });
    }
  }
}
