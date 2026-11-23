import { dialogueFor, type Talk } from '../../content/dialogue';
import type { Being } from './Being';
import type { Encounter } from './Encounter';

/** Opens the battle scene for a being (the scene then constructs the Battle). */
export type StartBattle = (being: Being) => void;

/** Factory Method (encounters), ConcreteProduct: a short exchange of words, then the fight. */
export class BattleEncounter implements Encounter {
  private readonly being: Being;
  private readonly talk: Talk;
  private readonly startBattle: StartBattle;

  constructor(being: Being, talk: Talk, startBattle: StartBattle) {
    this.being = being;
    this.talk = talk;
    this.startBattle = startBattle;
  }

  start(): void {
    this.talk(dialogueFor(this.being.id, this.being.name, 'fight'), () => this.startBattle(this.being));
  }
}
