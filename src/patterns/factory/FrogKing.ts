import { Assets } from '../../assets/Assets';
import { Being } from './Being';

/**
 * Factory Method (beings), ConcreteProduct: the Frog King, the easier boss that guards the forest.
 * Created by `BeingFactory.spawnGuardian('frog_king')`.
 */
export class FrogKing extends Being {
  constructor() {
    super('frog_king');
  }

  getSprites(): string[] {
    return [Assets.key('being', 'frog_king')];
  }
}
