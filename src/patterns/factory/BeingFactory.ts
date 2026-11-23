import { config, type BeingId } from '../../config';
import type { GuardianId } from '../../content/guardian';
import { GameState } from '../../core/GameState';
import { defaultRng, type Rng } from '../../core/Rng';
import { BossAI } from '../strategy/BossAI';
import { RandomAI } from '../strategy/RandomAI';
import type { Being } from './Being';
import { FrogKing } from './FrogKing';
import { ReedGuardian } from './ReedGuardian';

export interface SpawnEntry {
  id: BeingId;
  weight: number;
  boss?: boolean;
  minCoins?: number;
}

/** Factory Method (beings), Creator. `createBeing()` is the factory method; `spawn()` is the operation that uses it. */
export abstract class BeingFactory {
  protected readonly rng: Rng;

  constructor(rng: Rng = defaultRng) {
    this.rng = rng;
  }

  protected abstract spawnTable(): SpawnEntry[];

  /** The factory method: each concrete creator decides which Being class a rolled entry becomes. */
  protected abstract createBeing(entry: SpawnEntry): Being;

  /**
   * The creator's operation (the book's "AnOperation"): rolls the table, calls the factory method,
   * then gives the new being its AI and its follow behaviour. The same for every creator.
   */
  spawn(): Being {
    const entry = this.roll(this.spawnTable());
    const being = this.createBeing(entry);
    this.assignAI(being, entry);
    this.assignFollow(being);
    return being;
  }

  /**
   * (addition) The guardian of a place (the Reed Warden of the pond, the Frog King of the forest).
   * Not part of the random spawn tables. It is the same by day and by night, so it is a plain
   * method of the creator and not a factory method.
   */
  spawnGuardian(which: GuardianId): Being {
    const guardian = which === 'frog_king' ? new FrogKing() : new ReedGuardian();
    guardian.ai = new BossAI(); // it cycles its moves and ends every third turn with the last one
    return guardian;
  }

  /** Weighted pick. Nest 8: reads the player's progress (coins) from the one GameState. */
  protected roll(table: SpawnEntry[]): SpawnEntry {
    const coins = GameState.getInstance().getCoins();
    const eligible = table.filter((e) => e.minCoins === undefined || coins >= e.minCoins);
    const weights = eligible.map((e) => (e.boss ? e.weight * (1 + coins / config.bossCoinScale) : e.weight));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let pick = this.rng() * total;
    for (let i = 0; i < eligible.length; i++) {
      pick -= weights[i];
      if (pick < 0) return eligible[i];
    }
    return eligible[eligible.length - 1];
  }

  /** (addition) Preset chance per being (config.beings) that it follows the duck. */
  protected assignFollow(being: Being): void {
    being.follows = this.rng() < config.beings[being.id].followChance;
  }

  /** Nest 7: hands each new being the AI that fits it. */
  protected assignAI(being: Being, entry: SpawnEntry): void {
    being.ai = entry.boss ? new BossAI() : new RandomAI(this.rng);
  }
}
