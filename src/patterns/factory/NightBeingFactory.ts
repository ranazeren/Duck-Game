import { config } from '../../config';
import type { Being } from './Being';
import { BeingFactory, type SpawnEntry } from './BeingFactory';
import { Ghost } from './Ghost';
import { RobotDuck } from './RobotDuck';

/** Factory Method (beings), ConcreteCreator: creates Ghost or RobotDuck. */
export class NightBeingFactory extends BeingFactory {
  protected spawnTable(): SpawnEntry[] {
    return [
      { id: 'ghost', weight: config.beings.ghost.weight },
      { id: 'robot_duck', weight: config.beings.robot_duck.weight },
      { id: 'robot_duck', weight: config.bossWeight, boss: true, minCoins: config.bossMinCoins },
    ];
  }

  protected createBeing(entry: SpawnEntry): Being {
    return entry.id === 'ghost' ? new Ghost(entry.boss) : new RobotDuck(entry.boss);
  }
}
