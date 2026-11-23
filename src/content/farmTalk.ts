import { GameState } from '../core/GameState';
import type { SpokenLine, Talk } from './dialogue';
import { spoken, type FarmAnimal } from './farmAnimals';
import { getItem } from './items';

/** Shows lines, then the choices; calls `onPick` with the index the player chose. */
export type Ask = (lines: SpokenLine[], choices: string[], onPick: (index: number) => void) => void;

export interface FarmTalkHooks {
  ask: Ask;
  talk: Talk;
  toast(message: string): void;
}

const DUCK = 'Duck';

/**
 * Plain rules (no Phaser, no pattern): a conversation with a farm animal.
 * The animal greets, the duck picks something to say, the animal answers.
 * A kind answer earns the animal's furniture; if the duck already has it, the animal gives nothing.
 */
export function talkToAnimal(animal: FarmAnimal, hooks: FarmTalkHooks): void {
  hooks.ask(spoken(animal, animal.greeting), animal.options.map((o) => o.text), (index) => {
    const option = animal.options[index];
    if (!option) return;
    const lines: SpokenLine[] = [{ speaker: DUCK, text: option.text }, ...spoken(animal, option.reply)];
    if (!option.kind) {
      hooks.talk(lines, () => undefined);
      return;
    }
    const state = GameState.getInstance();
    if (state.isUnlocked(animal.furniture)) {
      hooks.talk([...lines, ...spoken(animal, animal.alreadyHave)], () => undefined);
      return;
    }
    hooks.talk([...lines, ...spoken(animal, animal.gift)], () => {
      state.unlock(animal.furniture);
      const name = getItem(animal.furniture)?.name ?? animal.furniture;
      hooks.toast(`${name} unlocked! You can place as many as you like.`);
    });
  });
}
