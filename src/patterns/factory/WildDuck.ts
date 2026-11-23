import { Assets } from '../../assets/Assets';
import { Being } from './Being';

/** Factory Method (beings), ConcreteProduct. Day. */
export class WildDuck extends Being {
  constructor(boss = false) {
    super('wild_duck', boss);
  }

  getSprites(): string[] {
    return [Assets.key('being', 'wild_duck')];
  }
}
