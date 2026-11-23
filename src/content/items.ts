import { config } from '../config';
import { Item, type ItemEffect } from './Item';

function healBy(amount: number): ItemEffect {
  return (target, log, item) => {
    const before = target.getHp();
    target.heal(amount);
    log.add(`${target.name} eats ${item.name} and recovers ${target.getHp() - before} HP.`);
  };
}

/** The items table. A new furniture or consumable is one entry here plus its manifest id. */
function staminaBy(amount: number): ItemEffect {
  return (target, log, item) => {
    const before = target.getStamina();
    target.restoreStamina(amount);
    log.add(`${target.name} eats ${item.name} and recovers ${target.getStamina() - before} stamina.`);
  };
}

export const ITEMS: Record<string, Item> = {
  berry: new Item('berry', 'Berry', `Heals ${config.heal.berry} HP.`, 'consumable', healBy(config.heal.berry)),
  bread: new Item('bread', 'Bread', `Heals ${config.heal.bread} HP.`, 'consumable', healBy(config.heal.bread)),
  corn: new Item('corn', 'Corn', `Restores ${config.stamina.corn} stamina.`, 'consumable', staminaBy(config.stamina.corn)),
  seed_cake: new Item('seed_cake', 'Seed Cake', `Restores ${config.stamina.seed_cake} stamina.`, 'consumable', staminaBy(config.stamina.seed_cake)),
  chair: new Item('chair', 'Chair', 'A place to sit.', 'furniture'),
  table: new Item('table', 'Table', 'A small round table.', 'furniture'),
  disco_ball: new Item('disco_ball', 'Disco Ball', 'Colorful lights spin around it at night.', 'furniture'),
  lamp: new Item('lamp', 'Lamp', 'A cozy lamp.', 'furniture'),
  rug: new Item('rug', 'Rug', 'A soft rug.', 'furniture'),
  hat: new Item('hat', 'Hat', `Outfit: attack +${config.outfitBonus.hat}.`, 'outfit'),
  sweater: new Item('sweater', 'Sweater', `Outfit: attack +${config.outfitBonus.sweater}.`, 'outfit'),
  rapper: new Item('rapper', 'Rapper Outfit', `Outfit: attack +${config.outfitBonus.rapper}.`, 'outfit'),
  cone_hat: new Item('cone_hat', 'Cone Hat', `Outfit: move speed +${config.outfitSpeed.cone_hat.moveSpeed}.`, 'outfit'),
  gloves: new Item('gloves', 'Boxing Gloves', `Outfit: attack speed +${config.outfitSpeed.gloves.attackSpeed}.`, 'outfit'),
};

/** What an outfit adds, for menus: "Attack +1", "Move speed +30", "Attack speed +4". */
export function outfitSummary(id: string): string {
  const parts: string[] = [];
  const attack = (config.outfitBonus as Record<string, number>)[id] ?? 0;
  const speed = config.outfitSpeed[id];
  if (attack > 0) parts.push(`Attack +${attack}`);
  if (speed && speed.moveSpeed > 0) parts.push(`Move speed +${speed.moveSpeed}`);
  if (speed && speed.attackSpeed > 0) parts.push(`Attack speed +${speed.attackSpeed}`);
  return parts.length > 0 ? parts.join('  ·  ') : 'No bonus';
}

export function getItem(id: string): Item | null {
  return ITEMS[id] ?? null;
}
