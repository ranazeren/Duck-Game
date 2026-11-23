import { Assets } from '../../assets/Assets';
import { Being } from './Being';

/** Factory Method (beings), ConcreteProduct. Night. */
export class RobotDuck extends Being {
  constructor(boss = false) {
    super('robot_duck', boss);
  }

  getSprites(): string[] {
    return [Assets.key('being', 'robot_duck')];
  }
}
