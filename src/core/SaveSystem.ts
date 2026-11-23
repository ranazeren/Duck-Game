import type { Phase } from './GameState';

export const SAVE_KEY = 'duck-game-save-v1';
export const SAVE_VERSION = 1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SaveData {
  version: number;
  coins: number;
  inventory: Record<string, number>;
  equipped: string[];
  placed: Record<string, string>;
  /** Furniture ids the player has unlocked (they can be placed any number of times). */
  unlocked: string[];
  minutesOfDay: number;
  phase: Phase;
  duckHp: number;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Reads and writes the save file. A missing or corrupt save yields null and never throws. */
export class SaveSystem {
  private readonly storage: StorageLike | null;

  constructor(storage: StorageLike | null = defaultStorage()) {
    this.storage = storage;
  }

  save(data: SaveData): void {
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable: the game simply continues unsaved.
    }
  }

  load(): SaveData | null {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return null;
      const d: unknown = JSON.parse(raw);
      if (!isRecord(d) || d.version !== SAVE_VERSION) return null;
      if (!isNumber(d.coins) || !isNumber(d.minutesOfDay) || !isNumber(d.duckHp)) return null;
      if (d.phase !== 'day' && d.phase !== 'night') return null;
      if (!isRecord(d.inventory) || !Object.values(d.inventory).every(isNumber)) return null;
      if (!Array.isArray(d.equipped) || !d.equipped.every((x) => typeof x === 'string')) return null;
      if (!isRecord(d.placed) || !Object.values(d.placed).every((x) => typeof x === 'string')) return null;
      return {
        version: SAVE_VERSION,
        coins: d.coins,
        inventory: d.inventory as Record<string, number>,
        equipped: d.equipped as string[],
        placed: d.placed as Record<string, string>,
        unlocked: Array.isArray(d.unlocked) ? d.unlocked.filter((x): x is string => typeof x === 'string') : [],
        minutesOfDay: d.minutesOfDay,
        phase: d.phase,
        duckHp: d.duckHp,
      };
    } catch {
      return null;
    }
  }
}
