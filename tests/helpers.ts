import type { Observer } from '../src/core/Observer';
import type { StorageLike } from '../src/core/SaveSystem';

/** Records every event it receives. */
export class Recorder implements Observer {
  events: Array<{ event: string; data: unknown }> = [];

  update(event: string, data?: unknown): void {
    this.events.push({ event, data });
  }

  names(): string[] {
    return this.events.map((e) => e.event);
  }

  of(event: string): unknown[] {
    return this.events.filter((e) => e.event === event).map((e) => e.data);
  }
}

/** In-memory stand-in for localStorage. */
export class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
