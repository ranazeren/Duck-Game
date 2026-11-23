import { config } from '../config';
import { GameState } from '../core/GameState';
import { getItem } from './items';

export type ShopCategory = 'outfit' | 'furniture' | 'consumable';

export const SHOP_CATEGORIES: readonly ShopCategory[] = ['outfit', 'furniture', 'consumable'];

export const SHOP_CATEGORY_LABEL: Record<ShopCategory, string> = {
  outfit: 'Outfits',
  furniture: 'Furniture',
  consumable: 'Food',
};

export interface ShopEntry {
  id: string;
  category: ShopCategory;
  price: number;
}

export type BuyResult = 'bought' | 'poor' | 'owned';

/** Plain rules (no Phaser, no pattern): what the barn shop sells and how buying works. Prices are in config.shop. */
export function shopEntries(category: ShopCategory): ShopEntry[] {
  return Object.entries(config.shop[category])
    .filter(([id]) => getItem(id) !== null)
    .map(([id, price]) => ({ id, category, price }));
}

/** Outfits and furniture are bought once; food can be bought again and again. */
export function isOwned(entry: ShopEntry): boolean {
  const state = GameState.getInstance();
  if (entry.category === 'outfit') return state.countOf(entry.id) > 0;
  if (entry.category === 'furniture') return state.isUnlocked(entry.id);
  return false;
}

export function buy(entry: ShopEntry): BuyResult {
  const state = GameState.getInstance();
  if (isOwned(entry)) return 'owned';
  if (state.getCoins() < entry.price) return 'poor';
  state.addCoins(-entry.price);
  if (entry.category === 'furniture') state.unlock(entry.id);
  else state.addItem(entry.id);
  return 'bought';
}
