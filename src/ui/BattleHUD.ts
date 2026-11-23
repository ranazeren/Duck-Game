import Phaser from 'phaser';
import { Audio } from '../assets/Audio';
import type { Battle, BattleResult, HpSnapshot } from '../battle/Battle';
import { config } from '../config';
import type { Observer } from '../core/Observer';

type HudEvent =
  | { kind: 'hp'; snapshot: HpSnapshot }
  | { kind: 'log'; line: string }
  | { kind: 'ended'; result: BattleResult };

export interface BattleHUDHooks {
  /** The turn has finished playing out and the battle goes on. */
  onIdle(): void;
  /** The result banner is showing. */
  onEnded(result: BattleResult): void;
  /** A side lost (negative) or regained (positive) HP: the scene plays the matching animation. */
  onHpChange(side: 'player' | 'enemy', delta: number): void;
}

const BAR_WIDTH = 200;
const LOG_LINES = 5;
const RESULT_TEXT: Record<BattleResult, string> = { win: 'You win!', lose: 'You lose...', fled: 'You got away.' };

/**
 * Observer pattern, ConcreteObserver of Battle (hp-changed, log-added, battle-ended).
 * A turn resolves instantly in the rules, so the HUD queues the events and plays them out one by one.
 */
export class BattleHUD implements Observer {
  private readonly scene: Phaser.Scene;
  private readonly hooks: BattleHUDHooks;
  private readonly playerBar: Phaser.GameObjects.Rectangle;
  private readonly enemyBar: Phaser.GameObjects.Rectangle;
  private readonly staminaBar: Phaser.GameObjects.Rectangle;
  private readonly staminaText: Phaser.GameObjects.Text;
  private readonly playerHpText: Phaser.GameObjects.Text;
  private readonly enemyHpText: Phaser.GameObjects.Text;
  private readonly logText: Phaser.GameObjects.Text;
  private readonly banner: Phaser.GameObjects.Text;
  private readonly lines: string[] = [];
  private pending: HudEvent[] = [];
  private playing = false;
  private ended = false;
  private lastHp: { player: number; enemy: number } | null = null;

  constructor(scene: Phaser.Scene, battle: Battle, playerX: number, enemyX: number, barY: number, hooks: BattleHUDHooks) {
    this.scene = scene;
    this.hooks = hooks;
    const text = { fontFamily: config.fontFamily, fontSize: '15px', color: '#ffffff' };

    scene.add.text(playerX, barY - 24, battle.player.name, text).setOrigin(0.5);
    scene.add.text(enemyX, barY - 24, battle.enemy.name, text).setOrigin(0.5);
    this.playerBar = this.makeBar(playerX, barY);
    this.enemyBar = this.makeBar(enemyX, barY);
    this.playerHpText = scene.add.text(playerX, barY + 18, '', text).setOrigin(0.5);
    this.enemyHpText = scene.add.text(enemyX, barY + 18, '', text).setOrigin(0.5);
    // The duck's stamina: moves cost it, and it comes back a little every turn.
    this.staminaBar = this.makeBar(playerX, barY + 52, 0x4aa3ff);
    this.staminaText = scene.add.text(playerX, barY + 70, '', text).setOrigin(0.5);

    scene.add.rectangle(20, 396, 580, 130, 0x10131c, 0.85).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.4);
    this.logText = scene.add.text(32, 406, '', { ...text, fontSize: '14px', lineSpacing: 6, wordWrap: { width: 556 } });
    this.banner = scene.add
      .text(config.gameWidth / 2, 200, '', { fontFamily: config.fontFamily, fontSize: '40px', color: '#ffe066', stroke: '#000000', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.showHp(battle.hpSnapshot());
  }

  update(event: string, data?: unknown): void {
    if (event === 'hp-changed') this.pending.push({ kind: 'hp', snapshot: data as HpSnapshot });
    else if (event === 'log-added') this.pending.push({ kind: 'log', line: data as string });
    else if (event === 'battle-ended') this.pending.push({ kind: 'ended', result: data as BattleResult });
    else return;
    if (!this.playing) this.playNext();
  }

  private playNext(): void {
    const next = this.pending.shift();
    if (!next) {
      this.playing = false;
      if (!this.ended) this.hooks.onIdle();
      return;
    }
    this.playing = true;
    if (next.kind === 'log') {
      this.lines.push(next.line);
      this.logText.setText(this.lines.slice(-LOG_LINES).join('\n'));
      this.scene.time.delayedCall(config.battleLogStepMs, () => this.playNext());
      return;
    }
    if (next.kind === 'hp') {
      this.showHp(next.snapshot);
    } else if (!this.ended) {
      this.ended = true;
      this.banner.setText(RESULT_TEXT[next.result]).setVisible(true);
      this.hooks.onEnded(next.result);
    }
    this.playNext();
  }

  private makeBar(x: number, y: number, color = 0x4cd137): Phaser.GameObjects.Rectangle {
    this.scene.add.rectangle(x - BAR_WIDTH / 2 - 2, y - 2, BAR_WIDTH + 4, 16, 0x000000, 0.8).setOrigin(0, 0);
    return this.scene.add.rectangle(x - BAR_WIDTH / 2, y, BAR_WIDTH, 12, color, 1).setOrigin(0, 0);
  }

  private showHp(s: HpSnapshot): void {
    if (this.lastHp) {
      const playerDelta = s.playerHp - this.lastHp.player;
      const enemyDelta = s.enemyHp - this.lastHp.enemy;
      if (playerDelta !== 0) this.hooks.onHpChange('player', playerDelta);
      if (enemyDelta !== 0) this.hooks.onHpChange('enemy', enemyDelta);
    }
    this.lastHp = { player: s.playerHp, enemy: s.enemyHp };
    const changed = this.playerHpText.text !== '' && (this.playerHpText.text !== `${s.playerHp} / ${s.playerMaxHp}` || this.enemyHpText.text !== `${s.enemyHp} / ${s.enemyMaxHp}`);
    if (changed) Audio.play('sfx', 'hit');
    this.playerBar.setDisplaySize(Math.max(0.001, (BAR_WIDTH * s.playerHp) / s.playerMaxHp), 12);
    this.enemyBar.setDisplaySize(Math.max(0.001, (BAR_WIDTH * s.enemyHp) / s.enemyMaxHp), 12);
    this.staminaBar.setDisplaySize(Math.max(0.001, (BAR_WIDTH * s.playerStamina) / s.playerMaxStamina), 12);
    this.staminaText.setText(`Stamina ${s.playerStamina} / ${s.playerMaxStamina}`);
    this.playerHpText.setText(`${s.playerHp} / ${s.playerMaxHp}`);
    this.enemyHpText.setText(`${s.enemyHp} / ${s.enemyMaxHp}`);
  }
}
