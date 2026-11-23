import Phaser from 'phaser';
import { config } from '../config';
import { GameState, type Phase } from '../core/GameState';
import type { Observer } from '../core/Observer';
import { scatterDecor } from '../content/decor';
import { guardianPresent } from '../content/guardian';
import { REED_BED, isPondWater, pondCellAt } from '../content/pondMap';
import { createRng, defaultRng } from '../core/Rng';
import { BattleEncounterFactory } from '../patterns/factory/BattleEncounterFactory';
import type { Being } from '../patterns/factory/Being';
import type { BeingFactory } from '../patterns/factory/BeingFactory';
import { DayBeingFactory } from '../patterns/factory/DayBeingFactory';
import type { EncounterFactory } from '../patterns/factory/EncounterFactory';
import { GiftEncounterFactory } from '../patterns/factory/GiftEncounterFactory';
import { NightBeingFactory } from '../patterns/factory/NightBeingFactory';
import { angryLine, type SpokenLine } from '../content/dialogue';
import { makeButton } from '../ui/Button';
import { MenuNav } from '../ui/MenuNav';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import { PondFrog } from '../ui/PondFrog';
import { WaterEffects } from '../ui/WaterEffects';
import {
  addBackground,
  addDecor,
  addEdgeCue,
  addHint,
  checkEdgeExit,
  getGuardianDefeat,
  fadeInScene,
  isFading,
  rememberPondBeing,
  takeRememberedPondBeing,
  talk,
  toast,
  transitionTo,
  type SpawnData,
} from './sceneHelpers';

/**
 * The pond is one screen: grass and a brick plaza on top, a plank pier, and water below (see content/pondMap.ts).
 * Everything here can be walked on or swum in.
 */
const WALK_TOP = 26;
/** Pixels hidden at the bottom of a being while it stands in the water. */
const BEING_SUBMERGED_PX = 8;

/**
 * Observes GameState (phase-changed) through its `stateObserver`, and is the Client of both factories:
 * it holds one BeingFactory (swapped with the phase) and one EncounterFactory (chosen by the player).
 */
export class PondScene extends Phaser.Scene {
  /** Observer pattern, ConcreteObserver: the object attached to GameState. It hands every event to this scene. */
  private readonly stateObserver: Observer = { update: (event, data) => this.onStateEvent(event, data) };
  private spawnTimer!: Phaser.Time.TimerEvent;
  private factory!: BeingFactory;
  private encounterFactory: EncounterFactory | null = null;
  private avatar!: PlayerAvatar;
  private wake!: WaterEffects;
  private frog!: PondFrog;
  private being: Being | null = null;
  private beingSprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null = null;
  private beingLabel: Phaser.GameObjects.Text | null = null;
  private prompt: Phaser.GameObjects.Container | null = null;
  private promptNav: MenuNav | null = null;
  /** Who the open Fight panel belongs to. */
  private promptTarget: 'being' | 'guardian' | null = null;
  /** The Reed Warden, standing in the reed bed (not one of the random beings). */
  private guardian: Being | null = null;
  private guardianSprite: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | null = null;
  private guardianLabel: Phaser.GameObjects.Text | null = null;
  private guardianDismissed = false;
  /** The player left the prompt with Backspace; it stays closed until the duck steps away from the being. */
  private dismissed = false;
  /** True once Fight or Befriend was chosen, until the being is gone. */
  private engaged = false;

  constructor() {
    super('PondScene');
  }

  create(data: SpawnData): void {
    const { gameWidth: w, gameHeight: h } = config;
    const state = GameState.getInstance();
    this.being = null;
    this.beingSprite = null;
    this.beingLabel = null;
    this.prompt = null;
    this.promptNav = null;
    this.promptTarget = null;
    this.guardian = null;
    this.guardianSprite = null;
    this.guardianLabel = null;
    this.guardianDismissed = false;
    this.dismissed = false;
    this.encounterFactory = null;
    this.engaged = false;

    addBackground(this, 'pond');
    // Grass decorations on the dry land only, away from the pier and where the duck arrives.
    const decorBlockers = addDecor(
      this,
      scatterDecor(createRng(34), {
        count: 10,
        area: { minX: 30, maxX: w - 30, minY: 70, maxY: 300 },
        avoid: [{ x: 350, y: 30, w: 130, h: 330 }],
        isOk: (x, y) => pondCellAt(x, y) === 'L' && pondCellAt(x - 20, y + 16) === 'L' && pondCellAt(x + 20, y + 16) === 'L' && pondCellAt(x, y + 28) === 'L',
      }),
    );

    this.physics.world.setBounds(0, WALK_TOP, w, h - WALK_TOP);
    this.avatar = new PlayerAvatar(this, data.spawnX ?? 170, data.spawnY ?? 450);
    this.physics.add.collider(this.avatar.sprite, decorBlockers); // the trees are solid
    this.wake = new WaterEffects(this);
    this.frog = new PondFrog(this, this.wake);
    // The pier runs off the top of the screen: that edge leads back to the farm.
    addEdgeCue(this, 'top', 0.43125);

    addHint(this, 'Creatures live in the pond and on its shore. Walk up to one to meet it. You can swim. Up the pier: the farm.');
    this.input.keyboard?.on('keydown-BACKSPACE', () => this.dismissPrompt());

    this.factory = this.factoryFor(state.getPhase());
    if (guardianPresent(getGuardianDefeat(this.game, 'reed_guardian'), state.getPhaseChanges())) this.placeGuardian();

    // A being that was here when the duck left is still here, where it stood, unless day or night came in between.
    const remembered = takeRememberedPondBeing(this.game);
    if (remembered && remembered.epoch === state.getPhaseChanges()) this.placeBeing(remembered.being, remembered.x, remembered.y);

    this.spawnTimer = this.time.addEvent({
      delay: config.spawnIntervalSec * 1000,
      loop: true,
      callback: () => this.onSpawn(),
    });

    state.attach(this.stateObserver);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      state.detach(this.stateObserver);
      this.spawnTimer.remove();
      // Leaving for the farm or the house: keep the being for next time. A fight or a befriend uses it up.
      if (this.being && this.beingSprite && !this.engaged) {
        rememberPondBeing(this.game, { being: this.being, x: this.beingSprite.x, y: this.beingSprite.y, epoch: state.getPhaseChanges() });
      }
    });

    fadeInScene(this);
  }

  /** Phaser's frame update. */
  update(time: number, delta: number): void {
    this.frame(time, delta);
  }

  /** The Observer's update, reached through `stateObserver`. */
  private onStateEvent(event: string, data?: unknown): void {
    if (event === 'phase-changed') {
      this.factory = this.factoryFor(data as Phase);
      this.despawn();
    }
  }

  /** Spawn attempt: only while the pond is empty. The being appears in the water or on the shore. */
  onSpawn(): void {
    if (this.being || isFading(this)) return;
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 12; tries++) {
      x = 100 + defaultRng() * (config.gameWidth - 200);
      y = WALK_TOP + 30 + defaultRng() * (config.gameHeight - WALK_TOP - 80);
      const awayFromDuck = Math.hypot(x - this.avatar.sprite.x, y - this.avatar.sprite.y) > 150;
      const awayFromBed = Math.hypot(x - REED_BED.x, y - REED_BED.y) > REED_BED.rx + 40;
      if (awayFromDuck && awayFromBed) break;
    }
    this.placeBeing(this.factory.spawn(), x, y);
  }

  private placeBeing(being: Being, x: number, y: number): void {
    this.being = being;
    this.engaged = false;
    this.beingSprite = this.physics.add.image(x, y, being.getSprites()[0]);
    this.beingSprite.setCollideWorldBounds(true).setDepth(9);
    this.beingLabel = this.add
      .text(x, y - 40, being.name, { fontFamily: config.fontFamily, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(12);
  }

  /** The Reed Warden stands in the middle of the reed bed. It is made by the factory, like the other beings. */
  private placeGuardian(): void {
    const guardian = this.factory.spawnGuardian('reed_guardian');
    this.guardian = guardian;
    this.guardianSprite = this.physics.add.image(REED_BED.x, REED_BED.y, guardian.getSprites()[0]);
    this.guardianSprite.setImmovable(true).setDepth(9);
    this.guardianSprite.setScale(1);
    this.guardianLabel = this.add
      .text(REED_BED.x, REED_BED.y - 62, `${guardian.name}  (guardian)`, { fontFamily: config.fontFamily, fontSize: '14px', fontStyle: 'bold', color: '#ffe066', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(12);
  }

  /** Whether something standing at (x, y) has its feet in the water. */
  private static inWater(x: number, y: number): boolean {
    return isPondWater(x, y + 14);
  }

  private frame(time: number, delta: number): void {
    const duck = this.avatar.sprite;
    // While the Fight / Befriend panel is open the arrow keys choose, so the duck stands still.
    this.avatar.update(isFading(this) || this.engaged || this.prompt !== null);
    // Up the pier: the duck arrives at the bottom of the farm, on its pier.
    checkEdgeExit(this, this.avatar.sprite, 'top', 'FarmScene', { minX: 400, maxX: 428 });
    this.frog.update(time, delta, duck.x, duck.y);

    // Swimming: the feet disappear and the duck leaves ripples and bubbles behind.
    const swimming = PondScene.inWater(duck.x, duck.y);
    this.avatar.setSubmerged(swimming);
    if (swimming && this.avatar.isMoving()) this.wake.emit(time, duck.x, duck.y + 12);

    // The Reed Warden: it waits in the reeds, looks at the duck, and offers a fight (and only a fight).
    const guard = this.guardianSprite;
    if (guard && this.guardian) {
      const near = this.physics.overlap(duck, guard);
      if (!near) this.guardianDismissed = false;
      if (near && !this.engaged && !isFading(this) && !this.prompt && !this.guardianDismissed) this.openGuardianPrompt();
      else if (!near && this.prompt && this.promptTarget === 'guardian') this.closePrompt();
      guard.setCrop(0, 0, guard.width, guard.height - BEING_SUBMERGED_PX);
      guard.setFlipX(duck.x > guard.x);
      this.guardianLabel?.setPosition(guard.x, guard.y - 62 + Math.sin(time / 300) * 2);
      if (time % 1400 < 20) this.wake.emit(time, guard.x + (Math.random() - 0.5) * 60, guard.y + 30);
    }

    const sprite = this.beingSprite;
    if (!sprite || !this.being) return;

    const touching = this.physics.overlap(duck, sprite);
    if (!touching) this.dismissed = false;
    if (touching && !this.engaged && !isFading(this)) {
      // A being that followed the duck and caught it starts the meeting by itself (Undertale style):
      // a fight or a friendly talk, at random. Others wait for the player's choice.
      if (this.being.follows) this.choose(Math.random() < config.catchFightChance ? 'fight' : 'befriend');
      else if (!this.prompt && !this.dismissed) this.openPrompt();
    } else if (!touching && this.prompt && this.promptTarget === 'being') this.closePrompt(); // only the panel of this being, never the guardian's

    // A being that follows the duck (decided when it spawned) walks toward it until they touch.
    const follows = this.being.follows && !touching && !this.engaged && !isFading(this);
    if (follows) this.physics.moveToObject(sprite, duck, config.beings[this.being.id].approachSpeed);
    else sprite.setVelocity(0, 0);

    const beingInWater = PondScene.inWater(sprite.x, sprite.y);
    if (beingInWater) sprite.setCrop(0, 0, sprite.width, sprite.height - BEING_SUBMERGED_PX);
    else sprite.setCrop();
    if (beingInWater && follows) this.wake.emit(time, sprite.x, sprite.y + 24);

    // Beings are drawn facing left; they turn to look at the duck.
    sprite.setFlipX(duck.x > sprite.x);
    this.beingLabel?.setPosition(sprite.x, sprite.y - 40 + Math.sin(time / 250) * 3);
  }

  private factoryFor(phase: Phase): BeingFactory {
    return phase === 'night' ? new NightBeingFactory() : new DayBeingFactory();
  }

  private openPrompt(): void {
    if (!this.being || !this.beingSprite) return;
    const x = Phaser.Math.Clamp(this.beingSprite.x - 110, 10, config.gameWidth - 240);
    const y = Math.max(46, this.beingSprite.y - 150);
    const panel = this.add.container(x, y).setDepth(30);
    panel.add(this.add.rectangle(0, 0, 250, 118, 0x10131c, 0.94).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.8));
    panel.add(this.add.text(125, 10, this.being.name, { fontFamily: config.fontFamily, fontSize: '17px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5, 0));
    const fight = makeButton(this, 20, 42, 'Fight', () => this.choose('fight'), { fontSize: 18 });
    const befriend = makeButton(this, 112, 42, 'Befriend', () => this.choose('befriend'), { fontSize: 18 });
    panel.add([fight, befriend]);
    panel.add(this.add.text(125, 96, 'Left / Right: choose   Enter: go   Backspace: leave', { fontFamily: config.fontFamily, fontSize: '12px', color: config.colors.textMuted }).setOrigin(0.5, 0.5));
    this.prompt = panel;
    this.promptTarget = 'being';
    this.promptNav = new MenuNav(this, 'horizontal', 35);
    this.promptNav.setItems([
      { target: fight, activate: () => this.choose('fight') },
      { target: befriend, activate: () => this.choose('befriend') },
    ]);
  }

  /** The Fight / Leave panel of the Reed Warden. */
  private openGuardianPrompt(): void {
    const guard = this.guardianSprite;
    const guardian = this.guardian;
    if (!guard || !guardian) return;
    const x = Phaser.Math.Clamp(guard.x - 125, 10, config.gameWidth - 260);
    const y = Math.max(46, guard.y - 190);
    const panel = this.add.container(x, y).setDepth(30);
    panel.add(this.add.rectangle(0, 0, 250, 118, 0x10131c, 0.94).setOrigin(0).setStrokeStyle(2, 0xffe066, 0.9));
    panel.add(this.add.text(125, 10, guardian.name, { fontFamily: config.fontFamily, fontSize: '17px', fontStyle: 'bold', color: '#ffe066' }).setOrigin(0.5, 0));
    const fight = makeButton(this, 20, 42, 'Fight', () => this.chooseGuardianFight(), { fontSize: 18 });
    const leave = makeButton(this, 112, 42, 'Leave', () => this.dismissPrompt(), { fontSize: 18 });
    panel.add([fight, leave]);
    panel.add(this.add.text(125, 96, 'Left / Right: choose   Enter: go   Backspace: leave', { fontFamily: config.fontFamily, fontSize: '12px', color: config.colors.textMuted }).setOrigin(0.5, 0.5));
    this.prompt = panel;
    this.promptTarget = 'guardian';
    this.promptNav = new MenuNav(this, 'horizontal', 35);
    this.promptNav.setItems([
      { target: fight, activate: () => this.chooseGuardianFight() },
      { target: leave, activate: () => this.dismissPrompt() },
    ]);
  }

  private chooseGuardianFight(): void {
    const guardian = this.guardian;
    if (!guardian || this.engaged || isFading(this)) return;
    this.engaged = true;
    this.closePrompt();
    this.encounterFactory = new BattleEncounterFactory(
      (lines, onDone) => talk(this, lines, onDone),
      (enemy) => transitionTo(this, 'BattleScene', { being: enemy, spawnX: this.avatar.sprite.x, spawnY: this.avatar.sprite.y }),
    );
    this.encounterFactory.begin(guardian);
  }

  private closePrompt(): void {
    this.promptNav?.destroy();
    this.promptNav = null;
    this.prompt?.destroy();
    this.prompt = null;
    this.promptTarget = null;
  }

  /** Backspace: leave the Fight / Befriend panel without choosing. */
  private dismissPrompt(): void {
    if (!this.prompt) return;
    if (this.promptTarget === 'guardian') this.guardianDismissed = true;
    else this.dismissed = true;
    this.closePrompt();
  }

  /** Builds the encounter through the matching EncounterFactory and starts it (it opens with a conversation). */
  private choose(choice: 'fight' | 'befriend'): void {
    const being = this.being;
    if (!being || this.engaged || isFading(this)) return;
    this.engaged = true;
    this.closePrompt();
    // Befriending can go wrong: the being gets angry (chance per being) and the meeting becomes a fight.
    let kind = choice;
    let prefix: SpokenLine[] = [];
    if (choice === 'befriend' && Math.random() < config.beings[being.id].angerChance) {
      kind = 'fight';
      prefix = [angryLine(being.id, being.name)];
    }
    const say = (lines: SpokenLine[], onDone: () => void): void => {
      talk(this, [...prefix, ...lines], onDone);
      prefix = [];
    };
    this.encounterFactory =
      kind === 'fight'
        ? new BattleEncounterFactory(say, (enemy) =>
            transitionTo(this, 'BattleScene', { being: enemy, spawnX: this.avatar.sprite.x, spawnY: this.avatar.sprite.y }),
          )
        : new GiftEncounterFactory({
            talk: say,
            toast: (message) => toast(this, message),
            despawn: () => this.despawn(),
          });
    this.encounterFactory.begin(being);
  }

  private despawn(): void {
    this.closePrompt();
    this.beingSprite?.destroy();
    this.beingLabel?.destroy();
    this.being = null;
    this.beingSprite = null;
    this.beingLabel = null;
    this.engaged = false;
  }
}
