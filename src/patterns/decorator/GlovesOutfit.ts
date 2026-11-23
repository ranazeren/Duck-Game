import { Assets } from '../../assets/Assets';
import { config } from '../../config';
import { OutfitDecorator } from './OutfitDecorator';

/** Decorator pattern, ConcreteDecorator: boxing gloves. Add attack speed. */
export class GlovesOutfit extends OutfitDecorator {
  getAttack(): number {
    return this.inner.getAttack() + config.outfitBonus.gloves;
  }

  getAttackSpeed(): number {
    return this.inner.getAttackSpeed() + config.outfitSpeed.gloves.attackSpeed;
  }

  getSprites(): string[] {
    return [...this.inner.getSprites(), Assets.key('outfit', 'gloves')];
  }
}
