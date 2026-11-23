import { describe, expect, it } from 'vitest';
import type { Observer } from '../../src/core/Observer';
import { Subject } from '../../src/core/Subject';

class TestSubject extends Subject {}

class Recorder implements Observer {
  events: Array<[string, unknown]> = [];
  update(event: string, data?: unknown): void {
    this.events.push([event, data]);
  }
}

describe('Subject', () => {
  it('pushes the event name and data to attached observers', () => {
    const subject = new TestSubject();
    const a = new Recorder();
    const b = new Recorder();
    subject.attach(a);
    subject.attach(b);
    subject.notify('ping', 42);
    expect(a.events).toEqual([['ping', 42]]);
    expect(b.events).toEqual([['ping', 42]]);
  });

  it('ignores duplicate attaches', () => {
    const subject = new TestSubject();
    const a = new Recorder();
    subject.attach(a);
    subject.attach(a);
    subject.notify('ping');
    expect(a.events).toHaveLength(1);
  });

  it('stops notifying after detach', () => {
    const subject = new TestSubject();
    const a = new Recorder();
    subject.attach(a);
    subject.detach(a);
    subject.notify('ping');
    expect(a.events).toHaveLength(0);
  });

  it('iterates over a copy, so an observer may detach itself while notified', () => {
    const subject = new TestSubject();
    const later = new Recorder();
    const selfRemoving: Observer = {
      update: () => subject.detach(selfRemoving),
    };
    subject.attach(selfRemoving);
    subject.attach(later);
    subject.notify('ping');
    subject.notify('ping');
    expect(later.events).toHaveLength(2);
  });
});
