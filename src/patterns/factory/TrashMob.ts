import { Assets } from '../../assets/Assets';
import { Being } from './Being';

/** Factory Method (beings), ConcreteProduct. Day. */
export class TrashMob extends Being {
  constructor(boss = false) {
    super('trash_mob', boss);
  }

  getSprites(): string[] {
    return [Assets.key('being', 'trash_mob')];
  }
}
