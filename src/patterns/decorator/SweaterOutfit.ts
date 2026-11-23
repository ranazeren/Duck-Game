import { Assets } from '../../assets/Assets';
import { config } from '../../config';
import { OutfitDecorator } from './OutfitDecorator';

/** Decorator pattern, ConcreteDecorator. */
export class SweaterOutfit extends OutfitDecorator {
  getAttack(): number {
    return this.inner.getAttack() + config.outfitBonus.sweater;
  }

  getSprites(): string[] {
    return [...this.inner.getSprites(), Assets.key('outfit', 'sweater')];
  }
}
