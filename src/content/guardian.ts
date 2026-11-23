import { config } from '../config';

/** The beings that stand guard over a place instead of coming out at random: the Reed Warden (pond) and the Frog King (forest). */
export type GuardianId = 'reed_guardian' | 'frog_king';

export const GUARDIAN_IDS: readonly GuardianId[] = ['reed_guardian', 'frog_king'];

export function isGuardian(id: string): id is GuardianId {
  return (GUARDIAN_IDS as readonly string[]).includes(id);
}

/**
 * Plain rules (no Phaser): a guardian stands at its place. Once beaten it is away for
 * `config.guardianRespawnChanges` day/night changes, then it is back (and fresh).
 * `epoch` is GameState.getPhaseChanges().
 */
export function guardianPresent(defeatedAt: number | undefined, epoch: number): boolean {
  return defeatedAt === undefined || epoch >= defeatedAt + config.guardianRespawnChanges;
}
