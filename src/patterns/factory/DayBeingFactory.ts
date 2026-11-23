import { config } from '../../config';
import type { Being } from './Being';
import { BeingFactory, type SpawnEntry } from './BeingFactory';
import { TrashMob } from './TrashMob';
import { WildDuck } from './WildDuck';

/** Factory Method (beings), ConcreteCreator: creates WildDuck or TrashMob. */
export class DayBeingFactory extends BeingFactory {
  protected spawnTable(): SpawnEntry[] {
    return [
      { id: 'wild_duck', weight: config.beings.wild_duck.weight },
      { id: 'trash_mob', weight: config.beings.trash_mob.weight },
      { id: 'trash_mob', weight: config.bossWeight, boss: true, minCoins: config.bossMinCoins },
    ];
  }

  protected createBeing(entry: SpawnEntry): Being {
    return entry.id === 'wild_duck' ? new WildDuck(entry.boss) : new TrashMob(entry.boss);
  }
}
