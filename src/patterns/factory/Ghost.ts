import { Assets } from '../../assets/Assets';
import { Being } from './Being';

/** Factory Method (beings), ConcreteProduct. Night. */
export class Ghost extends Being {
  constructor(boss = false) {
    super('ghost', boss);
  }

  getSprites(): string[] {
    return [Assets.key('being', 'ghost')];
  }
}
