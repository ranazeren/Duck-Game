import { describe, expect, it } from 'vitest';
import { Duck } from '../../src/patterns/decorator/Duck';
import { HatOutfit } from '../../src/patterns/decorator/HatOutfit';
import { OutfitDecorator } from '../../src/patterns/decorator/OutfitDecorator';
import { outfitClasses } from '../../src/patterns/decorator/outfitClasses';
import { RapperOutfit } from '../../src/patterns/decorator/RapperOutfit';
import { SweaterOutfit } from '../../src/patterns/decorator/SweaterOutfit';

describe('Decorator: outfits around a Duck', () => {
  it('a bare duck has 20 HP and attack 3', () => {
    const duck = new Duck();
    expect(duck.getMaxHp()).toBe(20);
    expect(duck.getAttack()).toBe(3);
    expect(duck.isAlive()).toBe(true);
  });

  it('each outfit adds its fixed bonus and appends one sprite', () => {
    const duck = new Duck();
    expect(new HatOutfit(duck).getAttack()).toBe(4);
    expect(new SweaterOutfit(duck).getAttack()).toBe(5);
    expect(new RapperOutfit(duck).getAttack()).toBe(6);
    expect(new SweaterOutfit(new HatOutfit(duck)).getSprites()).toEqual(['player/duck_base', 'outfit/hat', 'outfit/sweater']);
  });

  it('damage and healing always reach the one real duck', () => {
    const duck = new Duck();
    const dressed = new RapperOutfit(new SweaterOutfit(new HatOutfit(duck)));
    dressed.takeDamage(8);
    expect(duck.getHp()).toBe(12);
    expect(dressed.getHp()).toBe(12);
    dressed.heal(3);
    expect(duck.getHp()).toBe(15);
    dressed.takeDamage(99);
    expect(duck.isAlive()).toBe(false);
    expect(dressed.isAlive()).toBe(false);
    expect(dressed.name).toBe(duck.name);
  });

  it('outfitClasses maps each saved id to a decorator class', () => {
    expect(Object.keys(outfitClasses).sort()).toEqual(['cone_hat', 'gloves', 'hat', 'rapper', 'sweater']);
    for (const OutfitClass of Object.values(outfitClasses)) {
      expect(new OutfitClass(new Duck())).toBeInstanceOf(OutfitDecorator);
    }
  });
});
