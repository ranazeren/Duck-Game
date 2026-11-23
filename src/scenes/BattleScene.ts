import Phaser from 'phaser';
import { Battle } from '../battle/Battle';
import { config } from '../config';
import { isGuardian } from '../content/guardian';
import { GameState } from '../core/GameState';
import type { Being } from '../patterns/factory/Being';
import { WildDuck } from '../patterns/factory/WildDuck';
import { BattleHUD } from '../ui/BattleHUD';
import { BattleMenu } from '../ui/BattleMenu';
import { addBackground, fadeInScene, recordGuardianDefeat, getDayCycle, setInBattle, transitionTo, type SpawnData } from './sceneHelpers';

interface BattleSceneData extends SpawnData {
  being?: Being;
  /** The map to go back to after a win or a flee (the pond when not given). */
  returnTo?: string;
}

const PLAYER_X = 250;
const ENEMY_X = 710;
const SPRITE_Y = 270;

/** Plain scene: constructs the Battle, its HUD and its menu, draws both sides, and returns to the pond when it ends. */
export class BattleScene extends Phaser.Scene {
  private battle!: Battle;
  private hud!: BattleHUD;
  private menu!: BattleMenu;

  constructor() {
    super('BattleScene');
  }

  create(data: BattleSceneData): void {
    const enemy = data.being ?? new WildDuck();
    // A snapshot of the decorator chain: outfits cannot change mid-fight.
    const player = GameState.getInstance().getDuck();
    this.battle = new Battle(player, enemy);

    // The clock is paused from the moment the scene starts until it ends.
    getDayCycle(this.game)?.pause();
    setInBattle(this.game, true);

    addBackground(this, 'battle');
    const playerImages = player.getSprites().map((key) => this.add.image(PLAYER_X, SPRITE_Y, key).setScale(3));
    const enemyImages = enemy.getSprites().map((key) => this.add.image(ENEMY_X, SPRITE_Y, key).setScale(2));

    this.menu = new BattleMenu(this, this.battle, 620, 404);
    this.hud = new BattleHUD(this, this.battle, PLAYER_X, ENEMY_X, 130, {
      onIdle: () => this.menu.setEnabled(true),
      onHpChange: (side, delta) => this.animate(side === 'player' ? playerImages : enemyImages, side === 'player' ? enemyImages : playerImages, side, delta),
      onEnded: (result) => {
        this.time.delayedCall(config.battleResultMs, () => {
          // Beating a guardian keeps it away for a while.
          if (result === 'win' && isGuardian(enemy.id)) recordGuardianDefeat(this.game, enemy.id, GameState.getInstance().getPhaseChanges());
          // A knocked-out duck wakes up at home; otherwise it goes back to the pond.
          if (result === 'lose') transitionTo(this, 'HouseScene', { spawnX: 480, spawnY: 400 });
          else transitionTo(this, data.returnTo ?? 'PondScene', { spawnX: data.spawnX, spawnY: data.spawnY });
        });
      },
    });
    this.battle.attach(this.hud);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.battle.detach(this.hud);
      this.menu.destroy();
      getDayCycle(this.game)?.resume();
      setInBattle(this.game, false);
    });

    fadeInScene(this);
  }

  /**
   * Combat animation for an HP change. Damage: the other side lunges at its target, the target shakes and
   * flashes red (and sinks away when it is out of HP). Healing: the side flashes green and hops.
   */
  private animate(images: Phaser.GameObjects.Image[], others: Phaser.GameObjects.Image[], side: 'player' | 'enemy', delta: number): void {
    const out = this.battle.hpSnapshot();
    const lost = side === 'player' ? out.playerHp <= 0 : out.enemyHp <= 0;
    if (delta < 0) {
      const toward = side === 'player' ? -1 : 1; // the attacker is on the other side
      this.tweens.add({ targets: others, x: `+=${toward * 38}`, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
      this.time.delayedCall(110, () => {
        for (const image of images) image.setTint(0xff4040);
        this.tweens.add({ targets: images, x: '+=10', duration: 55, yoyo: true, repeat: 3 });
        this.time.delayedCall(330, () => {
          for (const image of images) image.clearTint();
          if (lost) this.tweens.add({ targets: images, alpha: 0.15, y: '+=18', duration: 500 });
        });
      });
    } else {
      for (const image of images) image.setTint(0x60ff80);
      this.tweens.add({ targets: images, y: '-=14', duration: 140, yoyo: true, repeat: 1 });
      this.time.delayedCall(420, () => {
        for (const image of images) image.clearTint();
      });
    }
  }
}
