import { config } from '../config';
import type { Combatant } from '../patterns/decorator/Combatant';
import { Duck } from '../patterns/decorator/Duck';
import { splitPlaced } from '../content/placement';
import { outfitClasses } from '../patterns/decorator/outfitClasses';
import { SaveSystem, SAVE_VERSION, type StorageLike } from './SaveSystem';
import { Subject } from './Subject';

export type Phase = 'day' | 'night';

const MINUTES_PER_DAY = 24 * 60;

function phaseAt(minutesOfDay: number): Phase {
  return minutesOfDay >= config.dayStartMinute && minutesOfDay < config.nightStartMinute ? 'day' : 'night';
}

/**
 * Singleton, and the one concrete Subject of the world (Nest 2).
 * Events: phase-changed, time-changed, coins-changed, inventory-changed, outfit-changed, house-changed.
 */
export class GameState extends Subject {
  private static instance: GameState | null = null;

  private phase: Phase;
  private phaseChanges = 0;
  private minutesOfDay: number;
  private coins: number;
  private inventory: Map<string, number>;
  private equipped: string[];
  private placed: Map<string, string>;
  private unlocked: Set<string>;
  private duck: Duck;
  private readonly saveSystem: SaveSystem;

  private constructor(saveSystem: SaveSystem) {
    super();
    this.saveSystem = saveSystem;
    this.minutesOfDay = config.startMinutesOfDay;
    this.phase = phaseAt(this.minutesOfDay);
    this.coins = config.startingCoins;
    this.inventory = new Map(Object.entries(config.startingInventory));
    this.equipped = [];
    this.placed = new Map();
    this.unlocked = new Set();
    this.duck = new Duck();
  }

  static getInstance(): GameState {
    if (!GameState.instance) GameState.instance = new GameState(new SaveSystem());
    return GameState.instance;
  }

  /** (addition) Replaces the instance with a fresh one. Used only by tests, which start with 0 coins so they do not depend on the tuning value. */
  static resetForTests(storage: StorageLike | null = null): GameState {
    GameState.instance = new GameState(new SaveSystem(storage));
    GameState.instance.coins = 0;
    return GameState.instance;
  }

  // --- clock -------------------------------------------------------------

  setPhase(phase: Phase): void {
    if (phase === this.phase) return;
    this.phase = phase;
    this.phaseChanges += 1;
    this.notify('phase-changed', phase);
  }

  advanceTime(minutes: number): void {
    if (!(minutes > 0)) return;
    const before = Math.floor(this.minutesOfDay);
    this.minutesOfDay = (this.minutesOfDay + minutes) % MINUTES_PER_DAY;
    const now = Math.floor(this.minutesOfDay);
    if (now !== before) this.notify('time-changed', now);
    this.setPhase(phaseAt(this.minutesOfDay));
  }

  // --- coins and inventory ----------------------------------------------

  /** (addition) Read access; coins change only through addCoins, so observers are always told. */
  getCoins(): number {
    return this.coins;
  }

  /** (addition) */
  addCoins(n: number): void {
    this.coins = Math.max(0, this.coins + n);
    this.notify('coins-changed', this.coins);
  }

  addItem(id: string): void {
    const count = this.countOf(id) + 1;
    this.inventory.set(id, count);
    this.notify('inventory-changed', { id, count });
  }

  removeItem(id: string): void {
    const count = this.countOf(id);
    if (count <= 0) return;
    if (count === 1) this.inventory.delete(id);
    else this.inventory.set(id, count - 1);
    this.notify('inventory-changed', { id, count: count - 1 });
  }

  /** Unlocks a piece of furniture for good: it can then be placed any number of times. */
  unlock(id: string): void {
    if (this.unlocked.has(id)) return;
    this.unlocked.add(id);
    this.notify('inventory-changed', { id, unlocked: true });
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  getUnlocked(): readonly string[] {
    return [...this.unlocked];
  }

  // --- outfits and house -------------------------------------------------

  setEquipped(ids: readonly string[]): void {
    this.equipped = [...ids];
    this.notify('outfit-changed', [...this.equipped]);
  }

  setPlaced(slot: string, id: string | null): void {
    if (id === null) this.placed.delete(slot);
    else this.placed.set(slot, id);
    this.notify('house-changed', { slot, id });
  }

  /** Nest 3: builds a new decorator chain around the one real Duck, in wearing order. */
  getDuck(): Combatant {
    let duck: Combatant = this.duck;
    for (const id of this.equipped) {
      const OutfitClass = outfitClasses[id];
      if (!OutfitClass) {
        console.warn(`[GameState] unknown outfit id "${id}" skipped`);
        continue;
      }
      duck = new OutfitClass(duck);
    }
    return duck;
  }

  // --- read access (additions: observers get pushed data; these serve first draws and guards) ---

  /** (addition) The duck's HP, read by the top bar. */
  getDuckHp(): { hp: number; maxHp: number } {
    return { hp: this.duck.getHp(), maxHp: this.duck.getMaxHp() };
  }

  getPhase(): Phase {
    return this.phase;
  }

  /**
   * (addition) How many times the phase has changed since the game started. Scenes that remember
   * where things stood compare it to see whether day or night came in between (day to night and back counts).
   */
  getPhaseChanges(): number {
    return this.phaseChanges;
  }

  getMinutesOfDay(): number {
    return this.minutesOfDay;
  }

  getInventory(): ReadonlyMap<string, number> {
    return this.inventory;
  }

  countOf(id: string): number {
    return this.inventory.get(id) ?? 0;
  }

  getEquipped(): readonly string[] {
    return this.equipped;
  }

  getPlaced(slot: string): string | null {
    return this.placed.get(slot) ?? null;
  }

  /** Every occupied slot with its item. */
  getPlacedItems(): ReadonlyMap<string, string> {
    return this.placed;
  }

  // --- persistence -------------------------------------------------------

  save(): void {
    this.saveSystem.save({
      version: SAVE_VERSION,
      coins: this.coins,
      inventory: Object.fromEntries(this.inventory),
      equipped: [...this.equipped],
      placed: Object.fromEntries(this.placed),
      unlocked: [...this.unlocked],
      minutesOfDay: this.minutesOfDay,
      phase: this.phase,
      duckHp: this.duck.getHp(),
    });
  }

  /** Returns true when a save was found and applied. Never throws. */
  load(): boolean {
    const data = this.saveSystem.load();
    if (!data) return false;
    this.coins = Math.max(0, data.coins);
    this.inventory = new Map(Object.entries(data.inventory).filter(([, n]) => n > 0));
    this.equipped = [...data.equipped];
    this.placed = new Map(Object.entries(data.placed));
    // Furniture standing in the house counts as unlocked (saves from before unlocking existed).
    this.unlocked = new Set([...data.unlocked, ...Object.values(data.placed).map((value) => splitPlaced(value).id)]);
    this.minutesOfDay = ((data.minutesOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    this.phase = data.phase;
    this.duck = new Duck();
    const hp = Math.max(1, Math.min(this.duck.getMaxHp(), data.duckHp));
    this.duck.takeDamage(this.duck.getMaxHp() - hp);
    this.notify('phase-changed', this.phase);
    this.notify('time-changed', Math.floor(this.minutesOfDay));
    this.notify('coins-changed', this.coins);
    this.notify('inventory-changed', undefined);
    this.notify('outfit-changed', [...this.equipped]);
    this.notify('house-changed', undefined);
    return true;
  }
}
