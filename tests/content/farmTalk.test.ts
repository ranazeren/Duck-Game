import { beforeEach, describe, expect, it } from 'vitest';
import { FARM_ANIMALS, animalsFor, type FarmAnimal } from '../../src/content/farmAnimals';
import { talkToAnimal, type FarmTalkHooks } from '../../src/content/farmTalk';
import { ITEMS } from '../../src/content/items';
import { GameState } from '../../src/core/GameState';

/** Plays a conversation: picks the given option and answers every "read on" at once. */
function converse(animal: FarmAnimal, pick: number): { toasts: string[]; spoken: string[] } {
  const toasts: string[] = [];
  const spoken: string[] = [];
  const hooks: FarmTalkHooks = {
    ask: (lines, choices, onPick) => {
      spoken.push(...lines.map((l) => l.text));
      expect(choices).toHaveLength(animal.options.length);
      onPick(pick);
    },
    talk: (lines, onDone) => {
      spoken.push(...lines.map((l) => l.text));
      onDone();
    },
    toast: (message) => toasts.push(message),
  };
  talkToAnimal(animal, hooks);
  return { toasts, spoken };
}

describe('Farm animals', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('two animals come out by day and two by night, each giving different furniture', () => {
    expect(animalsFor('day')).toHaveLength(2);
    expect(animalsFor('night')).toHaveLength(2);
    const gifts = FARM_ANIMALS.map((a) => a.furniture);
    expect(new Set(gifts).size).toBe(gifts.length);
    for (const id of gifts) expect(ITEMS[id]?.kind).toBe('furniture');
  });

  it('every animal has kind answers and at least one unkind one', () => {
    for (const animal of FARM_ANIMALS) {
      expect(animal.options.some((o) => o.kind)).toBe(true);
      expect(animal.options.some((o) => !o.kind)).toBe(true);
    }
  });

  it('the player starts with no furniture unlocked', () => {
    expect(GameState.getInstance().getUnlocked()).toEqual([]);
    for (const id of Object.keys(ITEMS)) if (ITEMS[id].kind === 'furniture') expect(GameState.getInstance().countOf(id)).toBe(0);
  });

  it('a kind answer unlocks the animal\'s furniture and says so', () => {
    for (const animal of FARM_ANIMALS) {
      GameState.resetForTests();
      const kind = animal.options.findIndex((o) => o.kind);
      const { toasts } = converse(animal, kind);
      expect(GameState.getInstance().isUnlocked(animal.furniture)).toBe(true);
      expect(toasts).toHaveLength(1);
    }
  });

  it('an unkind answer gives nothing', () => {
    const animal = FARM_ANIMALS[0];
    const unkind = animal.options.findIndex((o) => !o.kind);
    const { toasts } = converse(animal, unkind);
    expect(GameState.getInstance().getUnlocked()).toEqual([]);
    expect(toasts).toHaveLength(0);
  });

  it('an animal gives nothing when the furniture is already unlocked', () => {
    const animal = FARM_ANIMALS[0];
    GameState.getInstance().unlock(animal.furniture);
    const kind = animal.options.findIndex((o) => o.kind);
    const { toasts, spoken } = converse(animal, kind);
    expect(toasts).toHaveLength(0);
    expect(spoken).toContain(animal.alreadyHave[0]);
    expect(spoken).not.toContain(animal.gift[0]);
    expect(GameState.getInstance().getUnlocked()).toEqual([animal.furniture]);
  });

  it('unlocking twice does not notify twice', () => {
    const state = GameState.getInstance();
    let count = 0;
    state.attach({ update: (event) => event === 'inventory-changed' && (count += 1) });
    state.unlock('chair');
    state.unlock('chair');
    expect(count).toBe(1);
  });
});
