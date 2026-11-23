import Phaser from 'phaser';
import { config } from '../config';
import { GameState } from '../core/GameState';

/** Pixels cut off the bottom of the duck's textures while swimming (one pixel row of the art is 3 px). */
const SUBMERGED_HIDDEN_PX = 9;

const LEFT = { x: -1, y: 0 };
const RIGHT = { x: 1, y: 0 };
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };

/** Arrow keys and WASD both walk. */
const DIRECTIONS: Record<string, { x: number; y: number }> = {
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
  ArrowUp: UP,
  ArrowDown: DOWN,
  KeyA: LEFT,
  KeyD: RIGHT,
  KeyW: UP,
  KeyS: DOWN,
};

/**
 * Plain helper (not a pattern, see NOTES.md): the walking duck shared by the farm, house and pond.
 * Draws every key of `getDuck().getSprites()` stacked, and moves on one axis at a time:
 * the most recently pressed key wins, so diagonals never happen.
 * The duck turns to face the way it walks, and its outfit layers turn and move with it.
 */
export class PlayerAvatar {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly scene: Phaser.Scene;
  private layers: Phaser.GameObjects.Image[] = [];
  private pressed: string[] = [];
  private shownOutfits: readonly string[] | null = null;
  private facingLeft = false;
  private submerged = false;
  private moveSpeed = config.playerSpeed;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    const sprites = GameState.getInstance().getDuck().getSprites();
    this.sprite = scene.physics.add.sprite(x, y, sprites[0]);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    const keyboard = scene.input.keyboard;
    keyboard?.on('keydown', this.onKeyDown, this);
    keyboard?.on('keyup', this.onKeyUp, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.releaseAll, this);
    // A paused scene hears no key-up events, so forget held keys when it resumes.
    scene.events.on(Phaser.Scenes.Events.RESUME, this.releaseAll, this);
    // The physics step moves the base sprite at the end of the frame. Placing the outfit layers
    // right after it keeps them glued to the duck instead of trailing one frame behind.
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncLayers, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.RESUME, this.releaseAll, this);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncLayers, this);
      keyboard?.off('keydown', this.onKeyDown, this);
      keyboard?.off('keyup', this.onKeyUp, this);
      scene.game.events.off(Phaser.Core.Events.BLUR, this.releaseAll, this);
    });
    this.refreshLayers();
  }

  /** Call every frame. `locked` stops the duck (fades, open prompts, decorating). */
  update(locked: boolean): void {
    if (GameState.getInstance().getEquipped() !== this.shownOutfits) this.refreshLayers();
    const key = locked ? undefined : this.pressed[this.pressed.length - 1];
    const dir = key ? DIRECTIONS[key] : undefined;
    if (dir && dir.x !== 0) this.facingLeft = dir.x < 0;
    this.sprite.setVelocity((dir?.x ?? 0) * this.moveSpeed, (dir?.y ?? 0) * this.moveSpeed);
  }

  /** In the water the feet (and the lowest row of the body) are hidden, as if the duck were swimming. */
  setSubmerged(on: boolean): void {
    if (on === this.submerged) return;
    this.submerged = on;
    this.applyCrop();
  }

  isSubmerged(): boolean {
    return this.submerged;
  }

  /** True while the duck is moving. */
  isMoving(): boolean {
    return this.sprite.body !== null && (this.sprite.body.velocity.x !== 0 || this.sprite.body.velocity.y !== 0);
  }

  private applyCrop(): void {
    for (const image of [this.sprite, ...this.layers]) {
      if (this.submerged) image.setCrop(0, 0, image.width, image.height - SUBMERGED_HIDDEN_PX);
      else image.setCrop();
    }
  }

  private syncLayers(): void {
    this.sprite.setFlipX(this.facingLeft);
    for (const layer of this.layers) {
      layer.setPosition(this.sprite.x, this.sprite.y);
      layer.setFlipX(this.facingLeft);
    }
  }

  private refreshLayers(): void {
    const state = GameState.getInstance();
    this.shownOutfits = state.getEquipped();
    for (const layer of this.layers) layer.destroy();
    const duck = state.getDuck();
    this.moveSpeed = duck.getMoveSpeed();
    const sprites = duck.getSprites();
    this.sprite.setTexture(sprites[0]);
    this.layers = sprites
      .slice(1)
      .map((key, i) => this.scene.add.image(this.sprite.x, this.sprite.y, key).setDepth(11 + i));
    this.applyCrop();
    this.syncLayers();
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!(event.code in DIRECTIONS)) return;
    event.preventDefault();
    if (!this.pressed.includes(event.code)) this.pressed.push(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.pressed = this.pressed.filter((code) => code !== event.code);
  }

  private releaseAll(): void {
    this.pressed = [];
  }
}
