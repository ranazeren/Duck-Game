import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { config } from '../config';
import { GameState, type Phase } from '../core/GameState';
import type { Observer } from '../core/Observer';

/**
 * Observer pattern, ConcreteObserver of GameState (phase-changed, time-changed).
 * Keeps the sky in the colors of the phase: it swaps the current scene's background between its
 * day and night picture (no overlay is drawn over the screen), and it shows the sun or moon icon
 * and the clock next to it.
 */
export class SkyTint implements Observer {
  private readonly icon: Phaser.GameObjects.Image;
  private readonly clock: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Image | null = null;
  private backgroundId = '';

  constructor(scene: Phaser.Scene, iconX: number, iconY: number) {
    const state = GameState.getInstance();
    this.icon = scene.add.image(iconX, iconY, SkyTint.iconKey(state.getPhase()));
    this.clock = scene.add
      .text(iconX + 20, iconY, '', { fontFamily: config.fontFamily, fontSize: '18px', color: '#ffffff' })
      .setOrigin(0, 0.5);
    this.showTime(Math.floor(state.getMinutesOfDay()));
  }

  /** The background picture for an id in a phase: `<id>` by day, `<id>_night` by night. */
  static backgroundKey(id: string, phase: Phase): string {
    return Assets.key('background', phase === 'night' ? `${id}_night` : id);
  }

  /** A scene hands over its background image; from then on it follows the phase. */
  setBackground(image: Phaser.GameObjects.Image, id: string): void {
    this.background = image;
    this.backgroundId = id;
    image.setTexture(SkyTint.backgroundKey(id, GameState.getInstance().getPhase()));
  }

  /** Called when the scene that owns the image shuts down. */
  clearBackground(image: Phaser.GameObjects.Image): void {
    if (this.background === image) this.background = null;
  }

  update(event: string, data?: unknown): void {
    if (event === 'phase-changed') this.showPhase(data as Phase);
    else if (event === 'time-changed') this.showTime(data as number);
  }

  private static iconKey(phase: Phase): string {
    return Assets.key('ui', phase === 'night' ? 'moon' : 'sun');
  }

  private showPhase(phase: Phase): void {
    this.icon.setTexture(SkyTint.iconKey(phase));
    const image = this.background;
    if (!image || !image.active) return;
    const key = SkyTint.backgroundKey(this.backgroundId, phase);
    // Dip, swap the picture, come back: one second in total.
    const tweens = image.scene.tweens;
    tweens.killTweensOf(image);
    tweens.add({
      targets: image,
      alpha: 0.25,
      duration: config.skyTweenMs / 2,
      onComplete: () => {
        if (!image.active) return;
        image.setTexture(key);
        tweens.add({ targets: image, alpha: 1, duration: config.skyTweenMs / 2 });
      },
    });
  }

  private showTime(minutesOfDay: number): void {
    const hh = String(Math.floor(minutesOfDay / 60) % 24).padStart(2, '0');
    const mm = String(minutesOfDay % 60).padStart(2, '0');
    this.clock.setText(`${hh}:${mm}`);
  }
}
