import { Audio } from '../assets/Audio';
import { GameState, type Phase } from '../core/GameState';
import type { Observer } from '../core/Observer';

/** Observer pattern, ConcreteObserver of GameState (phase-changed): switches day and night music. */
export class MusicPlayer implements Observer {
  constructor() {
    this.play(GameState.getInstance().getPhase());
  }

  update(event: string, data?: unknown): void {
    if (event === 'phase-changed') this.play(data as Phase);
  }

  private play(phase: Phase): void {
    Audio.play('music', phase === 'night' ? 'night_theme' : 'day_theme');
  }
}
