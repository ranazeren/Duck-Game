import { config } from '../config';
import { GameState, type Phase } from './GameState';

const MINUTES_PER_DAY = 24 * 60;

/** Plain helper that ticks the in-game clock. Owned by UIScene. */
export class DayCycle {
  private readonly realMinutesPerDay: number;
  private paused = false;

  constructor(realMinutesPerDay: number = config.realMinutesPerDay) {
    this.realMinutesPerDay = realMinutesPerDay;
  }

  tick(deltaMs: number): void {
    if (this.paused) return;
    const gameMinutes = (deltaMs / 60000) * (MINUTES_PER_DAY / this.realMinutesPerDay);
    GameState.getInstance().advanceTime(gameMinutes);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Moves the clock forward to the start of the given phase. Works while paused. */
  jumpTo(phase: Phase): void {
    const state = GameState.getInstance();
    const target = phase === 'day' ? config.dayStartMinute : config.nightStartMinute;
    const delta = (target - state.getMinutesOfDay() + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    if (delta < 0.001) return;
    state.advanceTime(delta + 0.001);
  }
}
