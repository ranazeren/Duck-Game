import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { config } from '../config';
import { scatterDecor } from '../content/decor';
import { FARM_HOUSE, FARM_SHOP } from '../content/farmLayout';
import { FARM_PATH_HALF_WIDTH, distanceToPath } from '../content/farmPath';
import { FOREST_ARRIVAL, FOREST_GAP } from '../content/forestMap';
import { FARM_ANIMALS, animalsFor, type FarmAnimal } from '../content/farmAnimals';
import { createRng } from '../core/Rng';
import { talkToAnimal } from '../content/farmTalk';
import { GameState, type Phase } from '../core/GameState';
import { WildDuck } from '../patterns/factory/WildDuck';
import { makeButton } from '../ui/Button';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import {
  addBackground,
  addDecor,
  addEdgeArt,
  addEdgeCue,
  addHint,
  checkEdgeExit,
  addEntrance,
  ask,
  fadeInScene,
  getRememberedFarmAnimals,
  isFading,
  rememberFarmAnimals,
  talk,
  toast,
  transitionTo,
  type SpawnData,
} from './sceneHelpers';

const GROUND_TOP = 120;
/** The pier at the bottom of the farm, lined up with the pier on the pond map (cells 32 to 36 of 12 px). */
const PIER_LEFT = 384;
const PIER_RIGHT = 444;
/** The gap in the fence and the water banks, a little wider than the pier so the duck fits through. */
const GATE_LEFT = PIER_LEFT - 18;
const GATE_RIGHT = PIER_RIGHT + 18;
/** Where the fence and the cove of the bottom picture begin. */
const WATER_TOP = 496;
/** How far an animal strolls from its home spot, and how fast (pixels, pixels per second). */
const WANDER_RADIUS = 70;
const WANDER_SPEED = 14;

interface FarmCreature {
  animal: FarmAnimal;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  target: { x: number; y: number } | null;
  /** Milliseconds left to stand still before choosing the next spot. */
  rest: number;
}

/**
 * The hub: it draws, moves the duck, leads to the house (a cardboard box) and the pond,
 * and shows two farm animals by day and two by night. Talking to them is how furniture is unlocked.
 * The scene reads the phase every frame (no observer is attached, see NOTES.md).
 * The animals stroll about. When the duck leaves, their spots are remembered, and they are
 * found there again unless day or night came in between.
 */
export class FarmScene extends Phaser.Scene {
  private avatar!: PlayerAvatar;
  private shownPhase: Phase | null = null;
  private animals: FarmCreature[] = [];
  private prompt: Phaser.GameObjects.Container | null = null;
  private promptFor: FarmAnimal | null = null;
  private talking = false;

  constructor() {
    super('FarmScene');
  }

  create(data: SpawnData): void {
    const { gameWidth: w, gameHeight: h } = config;
    this.animals = [];
    this.prompt = null;
    this.promptFor = null;
    this.talking = false;
    this.shownPhase = null;

    addBackground(this, 'farm');
    this.add.tileSprite(0, GROUND_TOP, w, h - GROUND_TOP, Assets.key('ground', 'grass')).setOrigin(0);
    // The winding dirt path from the house door down to the pier.
    this.add.image(0, 0, Assets.key('ground', 'farm_path')).setOrigin(0);

    // Grass decorations in between: a few small trees, bushes, tall grass and flowers, kept off the paths, doors and animals.
    const decorBlockers = addDecor(
      this,
      scatterDecor(createRng(21), {
        count: 16,
        area: { minX: 30, maxX: w - 30, minY: GROUND_TOP + 40, maxY: 470 },
        avoid: [
          { x: 140, y: 100, w: 160, h: 150 }, // the house
          { x: 620, y: 100, w: 190, h: 150 }, // the shop
          { x: 790, y: 100, w: 170, h: 400 }, // the edge of the forest
          { x: 340, y: 300, w: 140, h: 120 }, // where the duck starts
          ...FARM_ANIMALS.map((a) => ({ x: a.x - 80, y: a.y - 70, w: 160, h: 140 })),
        ],
        isOk: (x, y) => distanceToPath(x, y) > FARM_PATH_HALF_WIDTH + 36, // off the path
      }),
    );

    this.physics.world.setBounds(0, GROUND_TOP, w, h - GROUND_TOP);
    this.avatar = new PlayerAvatar(this, data.spawnX ?? 480, data.spawnY ?? 320);
    this.physics.add.collider(this.avatar.sprite, decorBlockers); // the trees are solid

    addEntrance(this, this.avatar.sprite, FARM_HOUSE.x, FARM_HOUSE.y, 'to_house', 'House', { targetScene: 'HouseScene', spawnX: 480, spawnY: 400 });
    // The market stall at the back right is the shop.
    addEntrance(this, this.avatar.sprite, FARM_SHOP.x, FARM_SHOP.y, 'to_shop', 'Shop', { targetScene: 'ShopScene', spawnX: 0, spawnY: 0 });
    // The bottom of the farm is the pond. Its pier is in line with the pier on the pond map (x 360 to 480).
    // The right of the farm is the forest: a wall of trees with an opening where the trail goes in.
    addEdgeArt(this, 'right', 'edge_forest');
    addEdgeCue(this, 'right', (FOREST_GAP.minY + FOREST_GAP.maxY) / 2 / config.gameHeight);
    for (const [top, bottom] of [[GROUND_TOP - 40, FOREST_GAP.minY], [FOREST_GAP.maxY, WATER_TOP]]) {
      // the wall of trees (the strip is 160 px wide)
      const block = this.add.rectangle(config.gameWidth - 70, (top + bottom) / 2, 140, bottom - top, 0x000000, 0);
      this.physics.add.existing(block, true);
      this.physics.add.collider(this.avatar.sprite, block);
    }
    addEdgeArt(this, 'bottom', 'edge_pond');
    addEdgeCue(this, 'bottom', 0.43125);
    for (const [left, width] of [[0, GATE_LEFT], [GATE_RIGHT, config.gameWidth - GATE_RIGHT]]) {
      // The fence and the banks of the cove on both sides of the pier: the duck can only go down the pier.
      const block = this.add.rectangle(left + width / 2, WATER_TOP + 60, width, 120, 0x000000, 0);
      this.physics.add.existing(block, true);
      this.physics.add.collider(this.avatar.sprite, block);
    }

    addHint(this, 'Arrow keys or WASD: walk        I: inventory        Talk to the animals for furniture, or buy things at the shop        Down the pier: the pond');

    if (import.meta.env.DEV) {
      // Debug helper: B starts a test battle straight from the farm.
      this.input.keyboard?.on('keydown-B', () => transitionTo(this, 'BattleScene', { being: new WildDuck() }));
    }
    // E talks to the animal the duck is standing next to.
    this.input.keyboard?.on('keydown-E', () => this.promptFor && this.startTalk(this.promptFor));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const a of this.animals) positions[a.animal.id] = { x: a.sprite.x, y: a.sprite.y };
      rememberFarmAnimals(this.game, { epoch: GameState.getInstance().getPhaseChanges(), positions });
    });

    fadeInScene(this);
  }

  update(_time: number, delta: number): void {
    this.avatar.update(isFading(this) || this.talking);
    // Down the pier: the duck arrives at the top of the pier on the pond map.
    // Into the forest through the opening on the right.
    checkEdgeExit(this, this.avatar.sprite, 'right', 'ForestScene', FOREST_ARRIVAL);
    checkEdgeExit(this, this.avatar.sprite, 'bottom', 'PondScene', { minX: PIER_LEFT + 16, maxX: PIER_RIGHT - 16 });

    // Day animals by day, night animals by night.
    const phase = GameState.getInstance().getPhase();
    if (phase !== this.shownPhase) this.showAnimals(phase);

    this.wander(delta);

    if (this.talking) return;
    const duck = this.avatar.sprite;
    const near = this.animals.find((a) => Phaser.Math.Distance.Between(duck.x, duck.y, a.sprite.x, a.sprite.y) < 62);
    if (near && this.promptFor !== near.animal) this.openPrompt(near.animal, near.sprite);
    else if (!near && this.prompt) this.closePrompt();
  }

  private showAnimals(phase: Phase): void {
    this.shownPhase = phase;
    this.closePrompt();
    for (const a of this.animals) {
      a.sprite.destroy();
      a.label.destroy();
    }
    // Where they stood when the duck last left, if no day or night change happened since.
    const memory = getRememberedFarmAnimals(this.game);
    const remembered = memory && memory.epoch === GameState.getInstance().getPhaseChanges() ? memory.positions : {};
    this.animals = animalsFor(phase).map((animal) => {
      const at = remembered[animal.id] ?? { x: animal.x, y: animal.y };
      const sprite = this.add.image(at.x, at.y, Assets.key('animal', animal.id)).setDepth(at.y / 10);
      const label = this.add
        .text(at.x, at.y - 38, animal.name, { fontFamily: config.fontFamily, fontSize: '13px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 })
        .setOrigin(0.5, 1)
        .setDepth(12);
      return { animal, sprite, label, target: null, rest: 1000 + Math.random() * 3000 };
    });
  }

  /** Each animal rests a while, then ambles to a nearby spot around its home. */
  private wander(delta: number): void {
    for (const a of this.animals) {
      if (!a.target) {
        a.rest -= delta;
        if (a.rest > 0) continue;
        a.target = {
          x: Phaser.Math.Clamp(a.animal.x + (Math.random() * 2 - 1) * WANDER_RADIUS, 40, config.gameWidth - 40),
          y: Phaser.Math.Clamp(a.animal.y + (Math.random() * 2 - 1) * WANDER_RADIUS * 0.6, GROUND_TOP + 50, config.gameHeight - 60),
        };
      }
      const dx = a.target.x - a.sprite.x;
      const dy = a.target.y - a.sprite.y;
      const distance = Math.hypot(dx, dy);
      const step = (WANDER_SPEED * delta) / 1000;
      if (distance <= step) {
        a.sprite.setPosition(a.target.x, a.target.y);
        a.target = null;
        a.rest = 2000 + Math.random() * 4000;
      } else {
        a.sprite.setPosition(a.sprite.x + (dx / distance) * step, a.sprite.y + (dy / distance) * step);
      }
      a.sprite.setDepth(a.sprite.y / 10);
      a.label.setPosition(a.sprite.x, a.sprite.y - 38);
    }
  }

  private openPrompt(animal: FarmAnimal, at: Phaser.GameObjects.Image): void {
    this.closePrompt();
    this.promptFor = animal;
    const x = Phaser.Math.Clamp(at.x - 70, 10, config.gameWidth - 150);
    const panel = this.add.container(x, at.y - 96).setDepth(30);
    panel.add(this.add.rectangle(0, 0, 140, 50, 0x10131c, 0.94).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.8));
    panel.add(makeButton(this, 70, 25, 'Talk (E)', () => this.startTalk(animal), { fontSize: 15 }).setOrigin(0.5));
    this.prompt = panel;
  }

  private closePrompt(): void {
    this.prompt?.destroy();
    this.prompt = null;
    this.promptFor = null;
  }

  private startTalk(animal: FarmAnimal): void {
    if (this.talking || isFading(this)) return;
    this.talking = true;
    this.closePrompt();
    talkToAnimal(animal, {
      ask: (lines, choices, onPick) => ask(this, lines, choices, onPick),
      talk: (lines, onDone) =>
        talk(this, lines, () => {
          onDone();
          this.talking = false;
        }),
      toast: (message) => toast(this, message),
    });
  }
}
