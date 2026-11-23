import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { config } from '../config';
import type { SpokenLine } from '../content/dialogue';
import type { DecorSpot } from '../content/decor';
import { arrivalPoint, reachedEdge, type ArrivalLimits, type EdgeSide } from '../content/mapEdges';
import type { Being } from '../patterns/factory/Being';
import type { DayCycle } from '../core/DayCycle';
import { GameState } from '../core/GameState';
import type { CommandHistory } from '../patterns/command/CommandHistory';
import { SkyTint } from '../ui/SkyTint';

/**
 * Plain shared helpers for scenes (not a pattern, see NOTES.md):
 * fade transitions, entrances, backgrounds, toasts, conversations,
 * and the few values scenes share through the Phaser registry.
 */

export interface SpawnData {
  spawnX?: number;
  spawnY?: number;
}

export interface EntranceTarget {
  targetScene: string;
  spawnX: number;
  spawnY: number;
}

const fading = new WeakSet<Phaser.Scene>();

/** True while the scene is fading in or out. Scenes ignore input meanwhile. */
export function isFading(scene: Phaser.Scene): boolean {
  return fading.has(scene);
}

/** Call in `create()`: fades the new scene in. */
export function fadeInScene(scene: Phaser.Scene): void {
  fading.add(scene);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => fading.delete(scene));
  scene.cameras.main.fadeIn(config.fadeMs);
}

/** Fade out, autosave, then start the target scene. Repeat calls while fading are ignored. */
export function transitionTo(scene: Phaser.Scene, targetScene: string, data: object = {}): void {
  if (fading.has(scene)) return;
  fading.add(scene);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    fading.delete(scene);
    GameState.getInstance().save();
    scene.scene.start(targetScene, data);
  });
  scene.cameras.main.fadeOut(config.fadeMs);
}

/** An overlap zone that carries a target scene key and a spawn point. */
export function addEntrance(
  scene: Phaser.Scene,
  walker: Phaser.Physics.Arcade.Sprite,
  x: number,
  y: number,
  entranceId: string,
  label: string,
  target: EntranceTarget,
): void {
  const door = scene.physics.add.staticImage(x, y, Assets.key('entrance', entranceId));
  scene.add
    .text(x, y - door.height / 2 - 4, label, { fontFamily: config.fontFamily, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 })
    .setOrigin(0.5, 1);
  scene.physics.add.overlap(walker, door, () => {
    transitionTo(scene, target.targetScene, { spawnX: target.spawnX, spawnY: target.spawnY });
  });
}

/**
 * Stardew-style map change: call every frame. When the duck walks into the given screen edge, the map
 * fades out and the target scene starts with the duck just inside its opposite edge, at the same place
 * along it (kept inside `limits`: the part of the target map the duck may arrive on).
 */
export function checkEdgeExit(
  scene: Phaser.Scene,
  sprite: Phaser.Physics.Arcade.Sprite,
  side: EdgeSide,
  targetScene: string,
  limits: ArrivalLimits = {},
): void {
  if (isFading(scene) || !sprite.body) return;
  if (!reachedEdge(side, sprite.x, sprite.y, sprite.body.velocity.x, sprite.body.velocity.y)) return;
  const at = arrivalPoint(side, { x: sprite.x, y: sprite.y }, limits);
  transitionTo(scene, targetScene, { spawnX: at.x, spawnY: at.y });
}

/**
 * The picture of what lies beyond a screen edge. It sits on the ground, under the duck, and the duck walks over it.
 * `bottom` is a full-width strip at the bottom of the screen (the pond with the pier, seen from the farm).
 */
export function addEdgeArt(scene: Phaser.Scene, side: EdgeSide, id: string): void {
  const key = Assets.key('entrance', id);
  const w = config.gameWidth;
  const h = config.gameHeight;
  const image =
    side === 'bottom'
      ? scene.add.image(0, h, key).setOrigin(0, 1)
      : side === 'top'
        ? scene.add.image(0, 0, key).setOrigin(0, 0)
        : scene.add.image(side === 'right' ? w : 0, 0, key).setOrigin(side === 'right' ? 1 : 0, 0);
  image.setDepth(3);
}

/** Puts the scattered grass decorations on the map. They stand on the ground, behind the duck. Trees are solid. */
export function addDecor(scene: Phaser.Scene, spots: readonly DecorSpot[]): Phaser.GameObjects.Rectangle[] {
  const solid: Phaser.GameObjects.Rectangle[] = [];
  for (const spot of spots) {
    scene.add.image(spot.x, spot.y, Assets.key('decor', spot.id)).setOrigin(0.5, 0.9).setDepth(2 + spot.y / 200);
    if (spot.id === 'tree_small') {
      // The trunk is solid: the duck cannot walk through a tree. (Collide the duck with the returned bodies.)
      const trunk = scene.add.rectangle(spot.x, spot.y - 6, 26, 20, 0x000000, 0);
      scene.physics.add.existing(trunk, true);
      solid.push(trunk);
    }
  }
  return solid;
}

/** A faint arrow at the screen edge that leads to another map. */
export function addEdgeCue(scene: Phaser.Scene, side: EdgeSide, at = 0.5): void {
  const w = config.gameWidth;
  const h = config.gameHeight;
  const horizontal = side === 'left' || side === 'right';
  const x = horizontal ? (side === 'right' ? w - 16 : 16) : w * at;
  const y = horizontal ? h * at : side === 'bottom' ? h - 14 : 60;
  const g = scene.add.graphics().setDepth(25).setAlpha(0.4);
  g.fillStyle(0xffffff, 1);
  g.lineStyle(3, 0x000000, 0.7);
  const size = 14;
  const dx = side === 'right' ? 1 : side === 'left' ? -1 : 0;
  const dy = side === 'bottom' ? 1 : side === 'top' ? -1 : 0;
  // a triangle pointing out of the screen
  const tip = { x: dx * size, y: dy * size };
  const base1 = { x: -dx * size + dy * size, y: -dy * size + dx * size };
  const base2 = { x: -dx * size - dy * size, y: -dy * size - dx * size };
  g.fillTriangle(tip.x, tip.y, base1.x, base1.y, base2.x, base2.y);
  g.strokeTriangle(tip.x, tip.y, base1.x, base1.y, base2.x, base2.y);
  g.setPosition(x, y);
  scene.tweens.add({ targets: g, alpha: 0.85, x: x + dx * 6, y: y + dy * 6, duration: 700, yoyo: true, repeat: -1 });
}

/**
 * Adds the scene's full-screen background in the colors of the current phase and hands it to the
 * SkyTint observer, which swaps it between its day and night picture when the phase changes.
 */
export function addBackground(scene: Phaser.Scene, id: string): Phaser.GameObjects.Image {
  const image = scene.add.image(0, 0, SkyTint.backgroundKey(id, GameState.getInstance().getPhase())).setOrigin(0);
  const sky = getSkyTint(scene.game);
  sky?.setBackground(image, id);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => sky?.clearBackground(image));
  return image;
}

/**
 * A one-line hint at the bottom of a map. It fades away after `config.hintSeconds`, so it only
 * stays as long as it takes to read.
 */
export function addHint(scene: Phaser.Scene, text: string): Phaser.GameObjects.Text {
  const hint = scene.add
    .text(config.gameWidth / 2, config.gameHeight - 10, text, {
      fontFamily: config.fontFamily,
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 3 },
    })
    .setOrigin(0.5, 1)
    .setDepth(30);
  scene.time.delayedCall(config.hintSeconds * 1000, () => {
    if (!hint.active) return;
    scene.tweens.add({ targets: hint, alpha: 0, duration: 600, onComplete: () => hint.destroy() });
  });
  return hint;
}

// --- messages to the UI scene ----------------------------------------------

const TOAST_EVENT = 'duck-toast';
const TALK_EVENT = 'duck-talk';
const ASK_EVENT = 'duck-ask';

export function toast(scene: Phaser.Scene, message: string): void {
  scene.game.events.emit(TOAST_EVENT, message);
}

export function onToast(scene: Phaser.Scene, handler: (message: string) => void): void {
  scene.game.events.on(TOAST_EVENT, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(TOAST_EVENT, handler));
}

/** Shows a conversation; `onDone` runs after the player has read the last line. */
export function talk(scene: Phaser.Scene, lines: SpokenLine[], onDone: () => void): void {
  scene.game.events.emit(TALK_EVENT, lines, onDone);
}

export function onTalk(scene: Phaser.Scene, handler: (lines: SpokenLine[], onDone: () => void) => void): void {
  scene.game.events.on(TALK_EVENT, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(TALK_EVENT, handler));
}

/** Shows lines and then choices; `onPick` gets the index the player chose. */
export function ask(scene: Phaser.Scene, lines: SpokenLine[], choices: string[], onPick: (index: number) => void): void {
  scene.game.events.emit(ASK_EVENT, lines, choices, onPick);
}

export function onAsk(
  scene: Phaser.Scene,
  handler: (lines: SpokenLine[], choices: string[], onPick: (index: number) => void) => void,
): void {
  scene.game.events.on(ASK_EVENT, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(ASK_EVENT, handler));
}

// --- shared values ---------------------------------------------------------

const KEY_DAY_CYCLE = 'dayCycle';
const KEY_SKY_TINT = 'skyTint';
const KEY_HOUSE_HISTORY = 'houseHistory';
const KEY_IN_BATTLE = 'inBattle';
const KEY_POND_BEING = 'pondBeing';

/** A being that was at the pond when the duck left it, with where it stood and when (see GameState.getPhaseChanges). */
export interface RememberedBeing {
  being: Being;
  x: number;
  y: number;
  epoch: number;
}

export function rememberPondBeing(game: Phaser.Game, remembered: RememberedBeing | null): void {
  game.registry.set(KEY_POND_BEING, remembered);
}

const KEY_GUARDIAN_DEFEAT = 'guardianDefeatedAt';

/** Remembers when (GameState.getPhaseChanges) a guardian was beaten. */
export function recordGuardianDefeat(game: Phaser.Game, id: string, epoch: number): void {
  const all = (game.registry.get(KEY_GUARDIAN_DEFEAT) as Record<string, number> | undefined) ?? {};
  game.registry.set(KEY_GUARDIAN_DEFEAT, { ...all, [id]: epoch });
}

export function getGuardianDefeat(game: Phaser.Game, id: string): number | undefined {
  return ((game.registry.get(KEY_GUARDIAN_DEFEAT) as Record<string, number> | undefined) ?? {})[id];
}

const KEY_FARM_ANIMALS = 'farmAnimals';

/** Where each farm animal stood when the duck left the farm, and when. */
export interface RememberedFarmAnimals {
  epoch: number;
  positions: Record<string, { x: number; y: number }>;
}

export function rememberFarmAnimals(game: Phaser.Game, remembered: RememberedFarmAnimals): void {
  game.registry.set(KEY_FARM_ANIMALS, remembered);
}

export function getRememberedFarmAnimals(game: Phaser.Game): RememberedFarmAnimals | null {
  return (game.registry.get(KEY_FARM_ANIMALS) as RememberedFarmAnimals | undefined) ?? null;
}

/** Returns the remembered being once, and forgets it. */
export function takeRememberedPondBeing(game: Phaser.Game): RememberedBeing | null {
  const remembered = (game.registry.get(KEY_POND_BEING) as RememberedBeing | null | undefined) ?? null;
  game.registry.set(KEY_POND_BEING, null);
  return remembered;
}

export function setDayCycle(game: Phaser.Game, dayCycle: DayCycle): void {
  game.registry.set(KEY_DAY_CYCLE, dayCycle);
}

export function getDayCycle(game: Phaser.Game): DayCycle | null {
  return (game.registry.get(KEY_DAY_CYCLE) as DayCycle | undefined) ?? null;
}

export function setSkyTint(game: Phaser.Game, skyTint: SkyTint): void {
  game.registry.set(KEY_SKY_TINT, skyTint);
}

export function getSkyTint(game: Phaser.Game): SkyTint | null {
  return (game.registry.get(KEY_SKY_TINT) as SkyTint | undefined) ?? null;
}

/** The house's command history while the player is in the house, else null. */
export function setHouseHistory(game: Phaser.Game, history: CommandHistory | null): void {
  game.registry.set(KEY_HOUSE_HISTORY, history);
}

export function getHouseHistory(game: Phaser.Game): CommandHistory | null {
  return (game.registry.get(KEY_HOUSE_HISTORY) as CommandHistory | null | undefined) ?? null;
}

export function setInBattle(game: Phaser.Game, value: boolean): void {
  game.registry.set(KEY_IN_BATTLE, value);
}

export function isInBattle(game: Phaser.Game): boolean {
  return game.registry.get(KEY_IN_BATTLE) === true;
}
