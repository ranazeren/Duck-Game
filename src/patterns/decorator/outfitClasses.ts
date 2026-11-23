import type { Combatant } from './Combatant';
import { ConeHatOutfit } from './ConeHatOutfit';
import { GlovesOutfit } from './GlovesOutfit';
import { HatOutfit } from './HatOutfit';
import type { OutfitDecorator } from './OutfitDecorator';
import { RapperOutfit } from './RapperOutfit';
import { SweaterOutfit } from './SweaterOutfit';

/** A plain lookup table (not a factory): saved outfit id to decorator class. Used by GameState.getDuck(). */
export const outfitClasses: Record<string, new (inner: Combatant) => OutfitDecorator> = {
  hat: HatOutfit,
  sweater: SweaterOutfit,
  rapper: RapperOutfit,
  cone_hat: ConeHatOutfit,
  gloves: GlovesOutfit,
};
