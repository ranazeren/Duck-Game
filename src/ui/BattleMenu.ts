import Phaser from 'phaser';
import { Assets } from '../assets/Assets';
import { Audio } from '../assets/Audio';
import type { Battle } from '../battle/Battle';
import type { Item } from '../content/Item';
import { ITEMS } from '../content/items';
import { GameState } from '../core/GameState';
import { FleeCommand } from '../patterns/command/FleeCommand';
import { UseItemCommand } from '../patterns/command/UseItemCommand';
import { UseMoveCommand } from '../patterns/command/UseMoveCommand';
import type { Move } from '../patterns/strategy/Move';
import { Peck } from '../patterns/strategy/Peck';
import { Quack } from '../patterns/strategy/Quack';
import { makeButton } from './Button';
import { MenuNav, type NavItem } from './MenuNav';

/**
 * Command pattern (battle), Client: turns a menu choice into a concrete command,
 * submits it to the Battle (the invoker) and plays the turn.
 */
export class BattleMenu {
  private readonly scene: Phaser.Scene;
  private readonly battle: Battle;
  private readonly moves: Move[] = [new Peck(), new Quack()];
  private readonly container: Phaser.GameObjects.Container;
  private readonly nav: MenuNav;

  constructor(scene: Phaser.Scene, battle: Battle, x: number, y: number) {
    this.scene = scene;
    this.battle = battle;
    this.container = scene.add.container(x, y);
    // Arrow keys move a colored frame over the buttons; Enter or Space picks.
    this.nav = new MenuNav(scene, 'grid', 75);
    this.setEnabled(true);
  }

  /** Buttons are disabled while the log plays out. Enabling redraws them with fresh item counts. */
  setEnabled(enabled: boolean): void {
    this.container.removeAll(true);
    const state = GameState.getInstance();
    const stamina = this.battle.player.getStamina();
    const entries: Array<{ label: string; onClick: () => void; usable: boolean }> = [
      // A move shows its stamina cost; it is greyed out when the duck is too tired for it.
      ...this.moves.map((move) => ({ label: `${move.name} (${move.staminaCost})`, onClick: () => this.onMoveChosen(move), usable: stamina >= move.staminaCost })),
      ...Object.values(ITEMS)
        .filter((item) => item.kind === 'consumable' && state.countOf(item.id) > 0)
        .map((item) => ({ label: `${item.name} x${state.countOf(item.id)}`, onClick: () => this.onItemChosen(item), usable: true })),
      { label: 'Flee', onClick: () => this.onFlee(), usable: true },
    ];
    const navItems: NavItem[] = [];
    entries.forEach((entry, i) => {
      const button = makeButton(this.scene, (i % 2) * 165, Math.floor(i / 2) * 40, entry.label, entry.onClick, { enabled: enabled && entry.usable, fontSize: 18 });
      this.container.add(button);
      if (entry.usable) navItems.push({ target: button, activate: entry.onClick });
    });
    if (enabled) this.nav.setItems(navItems);
    else this.nav.clear();
  }

  destroy(): void {
    this.nav.destroy();
  }

  onMoveChosen(move: Move): void {
    if (this.battle.player.getStamina() < move.staminaCost) return;
    const sfx = move.name.toLowerCase();
    if (Assets.has('sfx', sfx)) Audio.play('sfx', sfx);
    this.run(() => this.battle.submit(new UseMoveCommand(this.battle.player, this.battle.enemy, move)));
  }

  onItemChosen(item: Item): void {
    if (GameState.getInstance().countOf(item.id) <= 0) return;
    this.run(() => this.battle.submit(new UseItemCommand(this.battle.player, this.battle.player, item)));
  }

  onFlee(): void {
    this.run(() => this.battle.submit(new FleeCommand(this.battle.player, this.battle)));
  }

  private run(submit: () => void): void {
    if (this.battle.isOver()) return;
    this.setEnabled(false);
    submit();
    this.battle.playTurn();
  }
}
