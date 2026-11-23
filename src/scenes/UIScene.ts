import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { Audio } from '../assets/Audio';
import { config } from '../config';
import { DayCycle } from '../core/DayCycle';
import { GameState } from '../core/GameState';
import { DialogueBox } from '../ui/DialogueBox';
import { InventoryPanel } from '../ui/InventoryPanel';
import { MusicPlayer } from '../ui/MusicPlayer';
import { SettingsPanel } from '../ui/SettingsPanel';
import { SkyTint } from '../ui/SkyTint';
import { getHouseHistory, isInBattle, onAsk, onTalk, onToast, setDayCycle, setSkyTint } from './sceneHelpers';

const PAUSED_TITLE = 'Paused';
const PAUSED_HINT = 'Press P to resume';
const EXIT_TITLE = 'Game saved';
const EXIT_HINT = 'You can close this tab now. Press P to keep playing.';

/** Why the game currently stands still. Several can hold at once. */
type FreezeReason = 'pause' | 'inventory' | 'dialogue' | 'settings';

/**
 * Plain scene that runs on top of the others: clock, phase icon, coins, inventory screen, toasts,
 * conversations and the settings menu (save, pause, volume, exit). Owns the DayCycle.
 */
export class UIScene extends Phaser.Scene {
  private dayCycle!: DayCycle;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimer: Phaser.Time.TimerEvent | null = null;
  private settings!: SettingsPanel;
  private dialogue!: DialogueBox;
  private readonly frozen = new Set<FreezeReason>();
  private frozenScenes: string[] = [];
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pauseTitle!: Phaser.GameObjects.Text;
  private hpFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private shownHp = '';
  private pauseHint!: Phaser.GameObjects.Text;

  constructor() {
    super('UIScene');
  }

  create(): void {
    const state = GameState.getInstance();
    const font = config.fontFamily;
    this.frozen.clear();
    this.frozenScenes = [];
    this.dayCycle = new DayCycle();
    setDayCycle(this.game, this.dayCycle);

    this.add.rectangle(0, 0, config.gameWidth, 36, 0x000000, 0.72).setOrigin(0).setDepth(-5);

    const skyTint = new SkyTint(this, 22, 18);
    setSkyTint(this.game, skyTint);
    const musicPlayer = new MusicPlayer();
    const inventoryPanel = new InventoryPanel(this, {
      activeHistory: () => getHouseHistory(this.game),
      inBattle: () => isInBattle(this.game),
      toast: (message) => this.showToast(message),
      blocked: () => this.dialogue.isOpen(),
      onToggle: (open) => this.setFrozen('inventory', open),
    });
    const observers = [skyTint, musicPlayer, inventoryPanel];
    for (const o of observers) state.attach(o);

    // The duck's HP: a bar with the numbers next to it (never color alone).
    this.add.image(250, 18, Assets.key('ui', 'heart'));
    this.add.rectangle(266, 18, 124, 16, 0x000000, 1).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 1);
    this.hpFill = this.add.rectangle(268, 18, 120, 12, 0x4cd137, 1).setOrigin(0, 0.5);
    this.hpText = this.add
      .text(400, 18, '', { fontFamily: font, fontSize: '15px', fontStyle: 'bold', color: config.colors.text })
      .setOrigin(0, 0.5);
    this.shownHp = '';
    this.updateHp();

    this.toastText = this.add
      .text(config.gameWidth / 2, 116, '', {
        fontFamily: font,
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setVisible(false);
    onToast(this, (message) => this.showToast(message));

    // Conversations: the game stands still while one is on screen.
    this.dialogue = new DialogueBox(this, {
      onOpen: () => this.setFrozen('dialogue', true),
      onClose: () => this.setFrozen('dialogue', false),
    });
    onTalk(this, (lines, onDone) => this.dialogue.show(lines, () => onDone()));
    onAsk(this, (lines, choices, onPick) => this.dialogue.show(lines, onPick, choices));

    // The overlay shown while the game is paused (also used as the exit screen).
    this.pauseTitle = this.add
      .text(config.gameWidth / 2, 64, PAUSED_TITLE, { fontFamily: font, fontSize: '36px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 6 })
      .setOrigin(0.5);
    this.pauseHint = this.add
      .text(config.gameWidth / 2, 96, PAUSED_HINT, { fontFamily: font, fontSize: '15px', color: '#dddddd', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5);
    this.pauseOverlay = this.add
      .container(0, 0, [
        this.add.rectangle(0, 36, config.gameWidth, config.gameHeight - 36, 0x000000, 0.6).setOrigin(0),
        this.pauseTitle,
        this.pauseHint,
      ])
      .setDepth(40)
      .setVisible(false);

    // Settings menu: the duck head in the middle of the top bar, or Esc. P is a shortcut for its Pause entry.
    this.settings = new SettingsPanel(this, {
      save: () => this.saveGame(),
      exit: () => this.exitGame(),
      goHome: () => this.goHome(),
      togglePause: () => this.togglePause(),
      isPaused: () => this.isPaused(),
      onToggle: (open) => this.setFrozen('settings', open),
    });
    const gear = this.add.image(config.gameWidth / 2, 18, Assets.key('ui', 'settings')).setDepth(95);
    gear.setInteractive({ useHandCursor: true });
    gear.on('pointerdown', () => {
      Audio.play('sfx', 'click');
      this.settings.toggle();
    });
    this.input.keyboard?.on('keydown-ESC', () => this.settings.toggle());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    const autosave = this.time.addEvent({
      delay: config.autosaveSec * 1000,
      loop: true,
      callback: () => GameState.getInstance().save(),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const o of observers) state.detach(o);
      autosave.remove();
    });
  }

  /** Redraws the HP bar when the duck's HP changed. The HP is read here because battles change it outside GameState. */
  private updateHp(): void {
    const { hp, maxHp } = GameState.getInstance().getDuckHp();
    const key = `${hp}/${maxHp}`;
    if (key === this.shownHp) return;
    this.shownHp = key;
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    this.hpFill.setDisplaySize(Math.max(0.001, 120 * ratio), 12);
    this.hpFill.setFillStyle(ratio > 0.5 ? 0x4cd137 : ratio > 0.25 ? 0xf1c40f : 0xe84118, 1);
    this.hpText.setText(`${hp} / ${maxHp}`);
  }

  update(_time: number, delta: number): void {
    this.updateHp();
    // The clock stands still whenever the game does (a battle pauses it separately through DayCycle).
    if (this.frozen.size === 0) this.dayCycle.tick(delta);
  }

  isPaused(): boolean {
    return this.frozen.has('pause');
  }

  /** Pauses or resumes the whole game: every other scene and the clock. */
  togglePause(): void {
    const paused = !this.isPaused();
    this.setFrozen('pause', paused);
    this.pauseTitle.setText(PAUSED_TITLE);
    this.pauseHint.setText(PAUSED_HINT);
    this.pauseOverlay.setVisible(paused);
    this.settings.refresh();
  }

  saveGame(): void {
    GameState.getInstance().save();
    this.showToast('Game saved.');
  }

  /**
   * A browser game cannot close its own tab, so Exit saves, freezes the game
   * and shows a closing screen the player can still come back from.
   */
  /**
   * A way out when something goes wrong (the duck stuck behind something, a scene in a bad state): closes the menu,
   * leaves the game paused-state, stops whatever map or fight is running and puts the duck in the house.
   */
  goHome(): void {
    GameState.getInstance().save();
    if (this.isPaused()) this.togglePause();
    this.settings.close();
    for (const key of ['FarmScene', 'HouseScene', 'PondScene', 'ForestScene', 'BattleScene', 'ShopScene']) {
      if (this.scene.manager.keys[key]) this.scene.stop(key);
    }
    this.scene.run('HouseScene', { spawnX: 480, spawnY: 400 });
    this.showToast('You are home.');
  }

  exitGame(): void {
    GameState.getInstance().save();
    this.settings.close();
    if (!this.isPaused()) this.togglePause();
    this.pauseTitle.setText(EXIT_TITLE);
    this.pauseHint.setText(EXIT_HINT);
  }

  /**
   * Adds or removes one reason for the game to stand still. With the first reason every other running
   * scene is paused (movement, timers, tweens, fades, input); when the last one goes they resume.
   */
  private setFrozen(reason: FreezeReason, on: boolean): void {
    const wasFrozen = this.frozen.size > 0;
    if (on) this.frozen.add(reason);
    else this.frozen.delete(reason);
    const isFrozen = this.frozen.size > 0;
    if (isFrozen === wasFrozen) return;
    if (isFrozen) {
      this.frozenScenes = this.scene.manager
        .getScenes(true)
        .map((scene) => scene.scene.key)
        .filter((key) => key !== this.scene.key);
      for (const key of this.frozenScenes) this.scene.pause(key);
    } else {
      for (const key of this.frozenScenes) if (this.scene.isPaused(key)) this.scene.resume(key);
      this.frozenScenes = [];
    }
  }

  private showToast(message: string): void {
    this.toastText.setText(message).setVisible(true);
    this.toastTimer?.remove();
    this.toastTimer = this.time.delayedCall(config.toastMs, () => this.toastText.setVisible(false));
  }
}
