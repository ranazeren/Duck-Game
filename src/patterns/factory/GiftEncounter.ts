import { config } from '../../config';
import { dialogueFor, type Talk } from '../../content/dialogue';
import { getItem } from '../../content/items';
import { GameState } from '../../core/GameState';
import type { Being } from './Being';
import type { Encounter } from './Encounter';

/** What a gift encounter needs from the scene, passed in so it never looks scenes up globally. */
export interface GiftHooks {
  talk: Talk;
  toast(message: string): void;
  despawn(): void;
}

/** Factory Method (encounters), ConcreteProduct: the being talks, hands over a gift and leaves. */
export class GiftEncounter implements Encounter {
  private readonly being: Being;
  private readonly hooks: GiftHooks;

  constructor(being: Being, hooks: GiftHooks) {
    this.being = being;
    this.hooks = hooks;
  }

  start(): void {
    this.hooks.talk(dialogueFor(this.being.id, this.being.name, 'befriend'), () => {
      const giftId = this.being.drop ?? config.defaultGift;
      const gift = getItem(giftId);
      GameState.getInstance().addItem(giftId);
      this.hooks.toast(`${this.being.name} gives you a ${gift ? gift.name : giftId}!`);
      this.hooks.despawn();
    });
  }
}
