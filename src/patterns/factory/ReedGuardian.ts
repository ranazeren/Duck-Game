import { Assets } from '../../assets/Assets';
import { Being } from './Being';

/**
 * Factory Method (beings), ConcreteProduct: the Reed Warden, a swan that guards the reeds of the pond.
 * Created by `BeingFactory.spawnGuardian()`. A long, hard fight: see config.beings.reed_guardian.
 */
export class ReedGuardian extends Being {
  constructor() {
    super('reed_guardian');
  }

  getSprites(): string[] {
    return [Assets.key('being', 'reed_guardian')];
  }
}
