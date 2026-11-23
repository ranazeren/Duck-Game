import { Assets } from '../../assets/Assets';
import { config } from '../../config';
import { OutfitDecorator } from './OutfitDecorator';

/** Decorator pattern, ConcreteDecorator: a traffic cone hat. Adds walking speed. */
export class ConeHatOutfit extends OutfitDecorator {
  getAttack(): number {
    return this.inner.getAttack() + config.outfitBonus.cone_hat;
  }

  getMoveSpeed(): number {
    return this.inner.getMoveSpeed() + config.outfitSpeed.cone_hat.moveSpeed;
  }

  getSprites(): string[] {
    return [...this.inner.getSprites(), Assets.key('outfit', 'cone_hat')];
  }
}
