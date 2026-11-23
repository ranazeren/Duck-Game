import type { Being } from './Being';
import type { Encounter } from './Encounter';
import { EncounterFactory } from './EncounterFactory';
import { GiftEncounter, type GiftHooks } from './GiftEncounter';

/** Factory Method (encounters), ConcreteCreator. */
export class GiftEncounterFactory extends EncounterFactory {
  private readonly hooks: GiftHooks;

  constructor(hooks: GiftHooks) {
    super();
    this.hooks = hooks;
  }

  create(being: Being): Encounter {
    return new GiftEncounter(being, this.hooks);
  }
}
