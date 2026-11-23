import type { Being } from './Being';
import type { Encounter } from './Encounter';

/** Factory Method (encounters), Creator. `create()` is the factory method; `begin()` is the operation that uses it. */
export abstract class EncounterFactory {
  abstract create(being: Being): Encounter;

  /** The creator's operation (the book's "AnOperation"): makes the encounter through the factory method and starts it. */
  begin(being: Being): Encounter {
    const encounter = this.create(being);
    encounter.start();
    return encounter;
  }
}
