import { beforeEach, describe, expect, it } from 'vitest';
import { Battle } from '../../src/battle/Battle';
import { ITEMS } from '../../src/content/items';
import { GameState } from '../../src/core/GameState';
import { Subject } from '../../src/core/Subject';
import { EquipOutfitCommand } from '../../src/patterns/command/EquipOutfitCommand';
import { FleeCommand } from '../../src/patterns/command/FleeCommand';
import { PlaceItemCommand } from '../../src/patterns/command/PlaceItemCommand';
import { RemoveItemCommand } from '../../src/patterns/command/RemoveItemCommand';
import { UseItemCommand } from '../../src/patterns/command/UseItemCommand';
import { UseMoveCommand } from '../../src/patterns/command/UseMoveCommand';
import { Duck } from '../../src/patterns/decorator/Duck';
import { HatOutfit } from '../../src/patterns/decorator/HatOutfit';
import { OutfitDecorator } from '../../src/patterns/decorator/OutfitDecorator';
import { RapperOutfit } from '../../src/patterns/decorator/RapperOutfit';
import { SweaterOutfit } from '../../src/patterns/decorator/SweaterOutfit';
import { BattleEncounterFactory } from '../../src/patterns/factory/BattleEncounterFactory';
import { Being } from '../../src/patterns/factory/Being';
import { BeingFactory } from '../../src/patterns/factory/BeingFactory';
import { DayBeingFactory } from '../../src/patterns/factory/DayBeingFactory';
import { EncounterFactory } from '../../src/patterns/factory/EncounterFactory';
import { Ghost } from '../../src/patterns/factory/Ghost';
import { GiftEncounterFactory } from '../../src/patterns/factory/GiftEncounterFactory';
import { NightBeingFactory } from '../../src/patterns/factory/NightBeingFactory';
import { RobotDuck } from '../../src/patterns/factory/RobotDuck';
import { TrashMob } from '../../src/patterns/factory/TrashMob';
import { WildDuck } from '../../src/patterns/factory/WildDuck';
import { BossAI } from '../../src/patterns/strategy/BossAI';
import { Peck } from '../../src/patterns/strategy/Peck';
import { Quack } from '../../src/patterns/strategy/Quack';
import { RandomAI } from '../../src/patterns/strategy/RandomAI';

/**
 * Guards the pattern skeleton of the class diagram for everything that runs without a browser.
 * (Interfaces leave no trace at run time, so "implements" is checked by the methods a class offers;
 * the compiler checks the rest. Scenes and UI observers need Phaser and are checked by `tsc`.)
 */
describe('Pattern skeleton', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('Singleton: GameState has one instance and no public constructor path besides getInstance', () => {
    expect(GameState.getInstance()).toBe(GameState.getInstance());
  });

  it('Observer: GameState and Battle are the concrete Subjects', () => {
    expect(GameState.getInstance()).toBeInstanceOf(Subject);
    expect(new Battle(new Duck(), new WildDuck())).toBeInstanceOf(Subject);
  });

  it('Decorator: every outfit is an OutfitDecorator wrapping a Combatant', () => {
    for (const Outfit of [HatOutfit, SweaterOutfit, RapperOutfit]) {
      const dressed = new Outfit(new Outfit(new Duck()));
      expect(dressed).toBeInstanceOf(OutfitDecorator);
      expect(dressed.getMaxHp()).toBe(new Duck().getMaxHp());
    }
  });

  it('Command (house): every concrete command offers execute and undo', () => {
    for (const cmd of [new PlaceItemCommand('c0r0', 'chair'), new RemoveItemCommand('c0r0'), new EquipOutfitCommand('hat')]) {
      expect(typeof cmd.execute).toBe('function');
      expect(typeof cmd.undo).toBe('function');
    }
  });

  it('Command (battle): every concrete command has an actor, a priority and execute, and no undo', () => {
    const duck = new Duck();
    const enemy = new WildDuck();
    const battle = new Battle(duck, enemy);
    const commands = [new UseMoveCommand(duck, enemy, new Peck()), new UseItemCommand(duck, duck, ITEMS.berry), new FleeCommand(duck, battle)];
    expect(commands.map((c) => c.priority)).toEqual([0, 1, 2]);
    for (const cmd of commands) {
      expect(cmd.actor).toBe(duck);
      expect(typeof cmd.execute).toBe('function');
      expect('undo' in cmd).toBe(false);
    }
  });

  it('Strategy: moves offer apply, enemy AIs return a command, and a Being holds its AI', () => {
    for (const move of [new Peck(), new Quack()]) expect(typeof move.apply).toBe('function');
    const being = new WildDuck();
    for (const ai of [new RandomAI(), new BossAI()]) {
      being.ai = ai;
      expect(typeof being.ai.chooseCommand(being, new Duck()).execute).toBe('function');
    }
  });

  it('Strategy: the Being is the context and forwards chooseCommand to its AI', () => {
    const being = new WildDuck();
    const player = new Duck();
    const answer = { actor: being, priority: 0, execute: (): void => undefined };
    const seen: unknown[] = [];
    being.ai = {
      chooseCommand: (self, target) => {
        seen.push(self, target);
        return answer;
      },
    };
    expect(being.chooseCommand(player)).toBe(answer);
    expect(seen).toEqual([being, player]);
  });

  it('Command: a command keeps the receiver it was made with', () => {
    const first = GameState.getInstance();
    first.unlock('chair');
    const place = new PlaceItemCommand('c1r1', 'chair');
    const second = GameState.resetForTests();
    place.execute();
    expect(first.getPlaced('c1r1')).toBe('chair');
    expect(second.getPlaced('c1r1')).toBeNull();
  });

  it('Factory Method (beings): concrete creators extend BeingFactory, products extend Being', () => {
    for (const factory of [new DayBeingFactory(), new NightBeingFactory()]) {
      expect(factory).toBeInstanceOf(BeingFactory);
      expect(factory.spawn()).toBeInstanceOf(Being);
      // The guardian does not depend on the phase: it is a plain method of the creator, not overridden.
      expect(Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(factory), 'spawnGuardian')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(factory), 'spawn')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(factory), 'createBeing')).toBe(true);
    }
    for (const product of [new WildDuck(), new TrashMob(), new Ghost(), new RobotDuck()]) expect(product).toBeInstanceOf(Being);
  });

  it('Factory Method (encounters): concrete creators extend EncounterFactory and create an Encounter', () => {
    const talk = (): void => undefined;
    const factories = [
      new BattleEncounterFactory(talk, () => undefined),
      new GiftEncounterFactory({ talk, toast: () => undefined, despawn: () => undefined }),
    ];
    for (const factory of factories) {
      expect(factory).toBeInstanceOf(EncounterFactory);
      expect(typeof factory.create(new WildDuck()).start).toBe('function');
    }
  });

  it('Factory Method (encounters): begin() creates through the factory method and starts the encounter', () => {
    let talks = 0;
    const factory = new BattleEncounterFactory(() => {
      talks += 1;
    }, () => undefined);
    const encounter = factory.begin(new WildDuck());
    expect(typeof encounter.start).toBe('function');
    expect(talks).toBe(1);
  });
});
