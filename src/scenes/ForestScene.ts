import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { config } from '../config';
import { FOREST_ARRIVAL, FOREST_BAND, FOREST_BOSS, FOREST_GAP, FOREST_WAGON } from '../content/forestMap';
import { guardianPresent } from '../content/guardian';
import { GameState } from '../core/GameState';
import { BattleEncounterFactory } from '../patterns/factory/BattleEncounterFactory';
import type { BeingFactory } from '../patterns/factory/BeingFactory';
import { DayBeingFactory } from '../patterns/factory/DayBeingFactory';
import { NightBeingFactory } from '../patterns/factory/NightBeingFactory';
import { Critter } from '../ui/Critter';
import { GuardianPost } from '../ui/GuardianPost';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { addBackground, addEdgeCue, addHint, checkEdgeExit, fadeInScene, getGuardianDefeat, isFading, talk, transitionTo, type SpawnData } from './sceneHelpers';

/**
 * Plain scene (no pattern): the forest, to the right of the farm. A trail leads from the opening at the left edge to the
 * clearing where the Frog King, an easier boss, sits on his stump. Squirrels and pigs wander about for company.
 * (Random creatures do not come out here yet, see docs/postpone-works.md.)
 */
export class ForestScene extends Phaser.Scene {
  private avatar!: PlayerAvatar;
  private post: GuardianPost | null = null;
  private critters: Critter[] = [];
  private engaged = false;

  constructor() {
    super('ForestScene');
  }

  create(data: SpawnData): void {
    const { gameWidth: w } = config;
    const state = GameState.getInstance();
    this.post = null;
    this.critters = [];
    this.engaged = false;

    addBackground(this, 'forest');
    // The wagon of a traveller stands near the trail.
    this.add.image(FOREST_WAGON.x, FOREST_WAGON.y, Assets.key('decor', 'forest_wagon')).setOrigin(0.5, 0.9).setDepth(2 + FOREST_WAGON.y / 200);

    this.physics.world.setBounds(0, FOREST_BAND.minY, w, FOREST_BAND.maxY - FOREST_BAND.minY);
    this.avatar = new PlayerAvatar(this, data.spawnX ?? 70, data.spawnY ?? (FOREST_GAP.minY + FOREST_GAP.maxY) / 2);

    // The trees on the left edge on both sides of the opening: the duck can only go back through the gap.
    for (const [top, bottom] of [[FOREST_BAND.minY - 40, FOREST_GAP.minY], [FOREST_GAP.maxY, FOREST_BAND.maxY + 40]]) {
      const block = this.add.rectangle(28, (top + bottom) / 2, 56, bottom - top, 0x000000, 0); // the trees at the edge
      this.physics.add.existing(block, true);
      this.physics.add.collider(this.avatar.sprite, block);
    }
    addEdgeCue(this, 'left', (FOREST_GAP.minY + FOREST_GAP.maxY) / 2 / config.gameHeight);

    // Squirrels run about, pigs forage slowly.
    const bounds = { minX: 80, maxX: w - 60, minY: FOREST_BAND.minY + 30, maxY: FOREST_BAND.maxY - 20 };
    const nearBoss = (x: number, y: number): boolean => Math.hypot(x - FOREST_BOSS.x, y - FOREST_BOSS.y) < 70;
    const nearWagon = (x: number, y: number): boolean => Math.abs(x - FOREST_WAGON.x) < 70 && Math.abs(y - FOREST_WAGON.y) < 40;
    const blocked = (x: number, y: number): boolean => nearBoss(x, y) || nearWagon(x, y);
    for (const [x, y] of [[300, 170], [520, 400], [800, 200]]) {
      this.critters.push(new Critter(this, Assets.key('animal', 'squirrel'), x, y, { speed: 48, bounds, rest: [500, 1800], blocked }));
    }
    for (const [x, y] of [[420, 230], [860, 400]]) {
      this.critters.push(new Critter(this, Assets.key('animal', 'pig'), x, y, { speed: 16, bounds, rest: [2000, 5000], blocked, reach: 80 }));
    }

    // The Frog King (unless he was beaten a short while ago). Made by the factory, like the other beings.
    if (guardianPresent(getGuardianDefeat(this.game, 'frog_king'), state.getPhaseChanges())) {
      const factory: BeingFactory = state.getPhase() === 'night' ? new NightBeingFactory() : new DayBeingFactory();
      this.post = new GuardianPost(this, factory.spawnGuardian('frog_king'), { x: FOREST_BOSS.x, y: FOREST_BOSS.y - 18, scale: 1 }, { onFight: (being) => this.startFight(being) });
    }

    addHint(this, 'The forest. The Frog King sits on his stump in the clearing. Back through the opening on the left: the farm.');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.post?.destroy());
    fadeInScene(this);
  }

  update(time: number, delta: number): void {
    this.avatar.update(isFading(this) || this.engaged || (this.post?.isPromptOpen() ?? false));
    // Back through the opening: the duck arrives at the right edge of the farm, in its gap.
    checkEdgeExit(this, this.avatar.sprite, 'left', 'FarmScene', FOREST_ARRIVAL);
    for (const critter of this.critters) critter.update(delta);
    this.post?.update(time, this.avatar.sprite, this.avatar.sprite.x, !this.engaged && !isFading(this));
  }

  /** Fighting is always possible. It starts with a conversation, then the battle (made by the battle EncounterFactory). */
  private startFight(being: Parameters<GuardianPostHooksFight>[0]): void {
    if (this.engaged || isFading(this)) return;
    this.engaged = true;
    new BattleEncounterFactory(
      (lines, onDone) => talk(this, lines, onDone),
      (enemy) => transitionTo(this, 'BattleScene', { being: enemy, returnTo: 'ForestScene', spawnX: this.avatar.sprite.x, spawnY: this.avatar.sprite.y }),
    ).begin(being);
  }
}

type GuardianPostHooksFight = (being: import('../patterns/factory/Being').Being) => void;
