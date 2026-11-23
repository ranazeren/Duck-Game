import type { Talk } from '../../content/dialogue';
import { BattleEncounter, type StartBattle } from './BattleEncounter';
import type { Being } from './Being';
import type { Encounter } from './Encounter';
import { EncounterFactory } from './EncounterFactory';

/** Factory Method (encounters), ConcreteCreator. */
export class BattleEncounterFactory extends EncounterFactory {
  private readonly talk: Talk;
  private readonly startBattle: StartBattle;

  constructor(talk: Talk, startBattle: StartBattle) {
    super();
    this.talk = talk;
    this.startBattle = startBattle;
  }

  create(being: Being): Encounter {
    return new BattleEncounter(being, this.talk, this.startBattle);
  }
}
