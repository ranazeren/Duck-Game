import type { Observer } from './Observer';

/** Observer pattern, Subject. */
export abstract class Subject {
  private observers: Observer[] = [];

  attach(o: Observer): void {
    if (!this.observers.includes(o)) this.observers.push(o);
  }

  detach(o: Observer): void {
    this.observers = this.observers.filter((x) => x !== o);
  }

  notify(event: string, data?: unknown): void {
    // Iterate over a copy so observers may attach or detach while being notified.
    for (const o of [...this.observers]) o.update(event, data);
  }
}
