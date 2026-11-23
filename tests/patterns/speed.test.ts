import { beforeEach, describe, expect, it } from 'vitest';
import { Battle } from '../../src/battle/Battle';
import { config } from '../../src/config';
import { outfitSummary } from '../../src/content/items';
import { GameState } from '../../src/core/GameState';
import type { BattleCommand } from '../../src/patterns/command/BattleCommand';
import type { Combatant } from '../../src/patterns/decorator/Combatant';
import { ConeHatOutfit } from '../../src/patterns/decorator/ConeHatOutfit';
import { Duck } from '../../src/patterns/decorator/Duck';
import { GlovesOutfit } from '../../src/patterns/decorator/GlovesOutfit';
import { HatOutfit } from '../../src/patterns/decorator/HatOutfit';
import { Ghost } from '../../src/patterns/factory/Ghost';
import { TrashMob } from '../../src/patterns/factory/TrashMob';
import { WildDuck } from '../../src/patterns/factory/WildDuck';

/** A command that only records when it ran. */
function marker(name: string, actor: Combatant, order: string[], priority = 0): BattleCommand {
  return { actor, priority, execute: () => void order.push(name) };
}

describe('Move speed and attack speed are separate stats', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('a bare duck has the base speeds', () => {
    const duck = new Duck();
    expect(duck.getMoveSpeed()).toBe(config.playerSpeed);
    expect(duck.getAttackSpeed()).toBe(config.duck.attackSpeed);
  });

  it('the cone hat adds move speed only', () => {
    const duck = new ConeHatOutfit(new Duck());
    expect(duck.getMoveSpeed()).toBe(config.playerSpeed + config.outfitSpeed.cone_hat.moveSpeed);
    expect(duck.getAttackSpeed()).toBe(config.duck.attackSpeed);
    expect(duck.getAttack()).toBe(config.duck.attack);
    expect(duck.getSprites()).toEqual(['player/duck_base', 'outfit/cone_hat']);
  });

  it('the boxing gloves add attack speed only', () => {
    const duck = new GlovesOutfit(new Duck());
    expect(duck.getAttackSpeed()).toBe(config.duck.attackSpeed + config.outfitSpeed.gloves.attackSpeed);
    expect(duck.getMoveSpeed()).toBe(config.playerSpeed);
  });

  it('other outfits keep passing both speeds through, and bonuses stack', () => {
    const duck = new GlovesOutfit(new ConeHatOutfit(new HatOutfit(new Duck())));
    expect(duck.getMoveSpeed()).toBe(config.playerSpeed + 30);
    expect(duck.getAttackSpeed()).toBe(config.duck.attackSpeed + 4);
    expect(duck.getAttack()).toBe(config.duck.attack + 1);
  });

  it('GameState.getDuck builds the chain for the new outfits too', () => {
    const state = GameState.getInstance();
    state.setEquipped(['cone_hat', 'gloves']);
    const duck = state.getDuck();
    expect(duck.getMoveSpeed()).toBe(config.playerSpeed + 30);
    expect(duck.getAttackSpeed()).toBe(config.duck.attackSpeed + 4);
  });

  it('beings have their own speeds from the config table', () => {
    expect(new WildDuck().getAttackSpeed()).toBe(config.beings.wild_duck.attackSpeed);
    expect(new Ghost().getMoveSpeed()).toBe(config.beings.ghost.approachSpeed);
  });

  it('outfit summaries list every bonus', () => {
    expect(outfitSummary('hat')).toBe('Attack +1');
    expect(outfitSummary('cone_hat')).toBe('Move speed +30');
    expect(outfitSummary('gloves')).toBe('Attack speed +4');
  });
});

describe('Attack speed decides who acts first among commands of the same priority', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('a faster enemy acts before the player', () => {
    const order: string[] = [];
    const player = new Duck(); // attack speed 10
    const enemy = new Ghost(); // attack speed 9, so slower... make it faster with a stub
    enemy.ai = { chooseCommand: () => marker('enemy', Object.assign(Object.create(enemy), { getAttackSpeed: () => 99 }) as Combatant, order) };
    const battle = new Battle(player, enemy);
    battle.submit(marker('player', player, order));
    battle.playTurn();
    expect(order).toEqual(['enemy', 'player']);
  });

  it('the player goes first when faster, and also on a full tie', () => {
    const order: string[] = [];
    const player = new GlovesOutfit(new Duck()); // 14
    const enemy = new TrashMob(); // 4
    enemy.ai = { chooseCommand: () => marker('enemy', enemy, order) };
    const battle = new Battle(player, enemy);
    battle.submit(marker('player', player, order));
    battle.playTurn();
    expect(order).toEqual(['player', 'enemy']);

    const tieOrder: string[] = [];
    const duck = new Duck();
    const twin = new Duck();
    const foe = new WildDuck();
    foe.ai = { chooseCommand: () => marker('enemy', twin, tieOrder) };
    const tie = new Battle(duck, foe);
    tie.submit(marker('player', duck, tieOrder));
    tie.playTurn();
    expect(tieOrder).toEqual(['player', 'enemy']);
  });

  it('priority still beats speed: an item used by a slow actor goes before a fast attack', () => {
    const order: string[] = [];
    const player = new Duck();
    const enemy = new WildDuck(); // slower
    enemy.ai = { chooseCommand: () => marker('enemy-move', enemy, order, 0) };
    const battle = new Battle(player, enemy);
    battle.submit(marker('player-move', player, order, 0));
    battle.submit(marker('player-item', enemy, order, 1));
    battle.playTurn();
    expect(order[0]).toBe('player-item');
  });
});
