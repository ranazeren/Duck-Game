import Phaser from 'phaser';
import { config } from '../config';
import type { Being } from '../patterns/factory/Being';
import { makeButton } from './Button';
import { MenuNav } from './MenuNav';

export interface GuardianPostOptions {
  x: number;
  y: number;
  scale?: number;
  /** Pixels hidden at the bottom of the guardian (it stands in water), 0 for none. */
  hiddenPx?: number;
}

export interface GuardianPostHooks {
  /** The player chose Fight. */
  onFight(being: Being): void;
}

/**
 * Plain UI class (not a pattern): a guardian standing at its place. When the duck is next to it, a Fight / Leave panel opens
 * (Left / Right and Enter, Backspace leaves; or click). Leaving keeps the panel shut until the duck steps away.
 * Fighting is always possible: there is no requirement, the fight is simply hard or easy.
 */
export class GuardianPost {
  readonly sprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private readonly scene: Phaser.Scene;
  private readonly being: Being;
  private readonly hooks: GuardianPostHooks;
  private readonly hiddenPx: number;
  private readonly label: Phaser.GameObjects.Text;
  private readonly onBackspace: () => void;
  private panel: Phaser.GameObjects.Container | null = null;
  private nav: MenuNav | null = null;
  private dismissed = false;

  constructor(scene: Phaser.Scene, being: Being, options: GuardianPostOptions, hooks: GuardianPostHooks) {
    this.scene = scene;
    this.being = being;
    this.hooks = hooks;
    this.hiddenPx = options.hiddenPx ?? 0;
    this.sprite = scene.physics.add.image(options.x, options.y, being.getSprites()[0]);
    this.sprite.setImmovable(true).setDepth(9).setScale(options.scale ?? 1);
    this.label = scene.add
      .text(options.x, options.y - 62, `${being.name}  (guardian)`, { fontFamily: config.fontFamily, fontSize: '14px', fontStyle: 'bold', color: '#ffe066', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(12);
    this.onBackspace = () => this.dismiss();
    scene.input.keyboard?.on('keydown-BACKSPACE', this.onBackspace);
  }

  isPromptOpen(): boolean {
    return this.panel !== null;
  }

  /** Call every frame. `canOpen` is false while something else (a fade, another fight) is going on. */
  update(time: number, duck: Phaser.GameObjects.GameObject, duckX: number, canOpen: boolean): void {
    const near = this.scene.physics.overlap(duck, this.sprite);
    if (!near) this.dismissed = false;
    if (near && canOpen && !this.panel && !this.dismissed) this.open();
    else if (!near && this.panel) this.close();
    if (this.hiddenPx > 0) this.sprite.setCrop(0, 0, this.sprite.width, this.sprite.height - this.hiddenPx);
    this.sprite.setFlipX(duckX > this.sprite.x);
    this.label.setPosition(this.sprite.x, this.sprite.y - 62 + Math.sin(time / 300) * 2);
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown-BACKSPACE', this.onBackspace);
    this.close();
    this.sprite.destroy();
    this.label.destroy();
  }

  private open(): void {
    const x = Phaser.Math.Clamp(this.sprite.x - 125, 10, config.gameWidth - 260);
    const y = Math.max(46, this.sprite.y - 190);
    const panel = this.scene.add.container(x, y).setDepth(30);
    panel.add(this.scene.add.rectangle(0, 0, 250, 118, 0x10131c, 0.94).setOrigin(0).setStrokeStyle(2, 0xffe066, 0.9));
    panel.add(this.scene.add.text(125, 10, this.being.name, { fontFamily: config.fontFamily, fontSize: '17px', fontStyle: 'bold', color: '#ffe066' }).setOrigin(0.5, 0));
    const fight = makeButton(this.scene, 20, 42, 'Fight', () => this.fight(), { fontSize: 18 });
    const leave = makeButton(this.scene, 112, 42, 'Leave', () => this.dismiss(), { fontSize: 18 });
    panel.add([fight, leave]);
    panel.add(this.scene.add.text(125, 96, 'Left / Right: choose   Enter: go   Backspace: leave', { fontFamily: config.fontFamily, fontSize: '12px', color: config.colors.textMuted }).setOrigin(0.5, 0.5));
    this.panel = panel;
    this.nav = new MenuNav(this.scene, 'horizontal', 35);
    this.nav.setItems([
      { target: fight, activate: () => this.fight() },
      { target: leave, activate: () => this.dismiss() },
    ]);
  }

  private close(): void {
    this.nav?.destroy();
    this.nav = null;
    this.panel?.destroy();
    this.panel = null;
  }

  private dismiss(): void {
    if (!this.panel) return;
    this.close();
    this.dismissed = true;
  }

  private fight(): void {
    this.close();
    this.hooks.onFight(this.being);
  }
}
