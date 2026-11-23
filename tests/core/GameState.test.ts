import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../../src/config';
import { DayCycle } from '../../src/core/DayCycle';
import { GameState } from '../../src/core/GameState';
import { Recorder } from '../helpers';

describe('GameState (Singleton + Subject)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('always returns the same instance', () => {
    expect(GameState.getInstance()).toBe(GameState.getInstance());
  });

  it('starts with the placeholder content', () => {
    const state = GameState.getInstance();
    expect(state.getCoins()).toBe(0);
    expect(state.countOf('berry')).toBe(2);
    expect(state.countOf('bread')).toBe(0);
    expect(state.getPlaced('floor')).toBeNull();
    expect(state.getPhase()).toBe('day');
  });

  it('flips to night at 18:00 and back to day at 06:00', () => {
    const state = GameState.getInstance();
    const rec = new Recorder();
    state.attach(rec);
    const toEvening = config.nightStartMinute - state.getMinutesOfDay();
    state.advanceTime(toEvening - 1);
    expect(state.getPhase()).toBe('day');
    state.advanceTime(1);
    expect(state.getPhase()).toBe('night');
    state.advanceTime(12 * 60 - 1);
    expect(state.getPhase()).toBe('night');
    state.advanceTime(1);
    expect(state.getPhase()).toBe('day');
    expect(rec.of('phase-changed')).toEqual(['night', 'day']);
  });

  it('counts phase changes, so scenes can tell whether day or night came in between', () => {
    const state = GameState.getInstance();
    expect(state.getPhaseChanges()).toBe(0);
    state.setPhase('night');
    state.setPhase('night');
    expect(state.getPhaseChanges()).toBe(1);
    state.setPhase('day');
    expect(state.getPhaseChanges()).toBe(2); // night and back to day still counts
  });

  it('emits time-changed at most once per in-game minute', () => {
    const state = GameState.getInstance();
    const rec = new Recorder();
    state.attach(rec);
    for (let i = 0; i < 10; i++) state.advanceTime(0.25);
    expect(rec.of('time-changed')).toHaveLength(2);
  });

  it('emits an event for coins, inventory, outfits and the house', () => {
    const state = GameState.getInstance();
    const rec = new Recorder();
    state.attach(rec);
    state.addCoins(5);
    state.addItem('bread');
    state.removeItem('bread');
    state.setEquipped(['hat']);
    state.setPlaced('floor', 'chair');
    expect(rec.names()).toEqual(['coins-changed', 'inventory-changed', 'inventory-changed', 'outfit-changed', 'house-changed']);
    expect(rec.of('coins-changed')).toEqual([5]);
  });

  it('removing an item that is not owned changes nothing', () => {
    const state = GameState.getInstance();
    const rec = new Recorder();
    state.attach(rec);
    state.removeItem('bread');
    expect(rec.events).toHaveLength(0);
  });
});

describe('GameState.getDuck (Singleton builds the Decorator chain)', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('has the base attack with no outfits', () => {
    const duck = GameState.getInstance().getDuck();
    expect(duck.getAttack()).toBe(3);
    expect(duck.getSprites()).toEqual(['player/duck_base']);
  });

  it('adds the bonus of one outfit', () => {
    const state = GameState.getInstance();
    state.setEquipped(['hat']);
    expect(state.getDuck().getAttack()).toBe(4);
  });

  it('adds the bonuses of three outfits and keeps the wearing order', () => {
    const state = GameState.getInstance();
    state.setEquipped(['rapper', 'hat', 'sweater']);
    const duck = state.getDuck();
    expect(duck.getAttack()).toBe(3 + 3 + 1 + 2);
    expect(duck.getSprites()).toEqual(['player/duck_base', 'outfit/rapper', 'outfit/hat', 'outfit/sweater']);
  });

  it('shares HP between every wrapper chain', () => {
    const state = GameState.getInstance();
    state.setEquipped(['hat', 'sweater']);
    state.getDuck().takeDamage(6);
    state.setEquipped([]);
    expect(state.getDuck().getHp()).toBe(14);
    state.getDuck().heal(100);
    expect(state.getDuck().getHp()).toBe(20);
  });

  it('skips an unknown outfit id with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const state = GameState.getInstance();
    state.setEquipped(['hat', 'cape']);
    expect(state.getDuck().getAttack()).toBe(4);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe('DayCycle', () => {
  beforeEach(() => {
    GameState.resetForTests();
  });

  it('advances one in-game day in realMinutesPerDay real minutes', () => {
    const state = GameState.getInstance();
    const start = state.getMinutesOfDay();
    new DayCycle(10).tick(60_000);
    expect(state.getMinutesOfDay() - start).toBeCloseTo(144);
  });

  it('does not advance while paused', () => {
    const state = GameState.getInstance();
    const cycle = new DayCycle();
    const start = state.getMinutesOfDay();
    cycle.pause();
    cycle.tick(60_000);
    expect(state.getMinutesOfDay()).toBe(start);
    cycle.resume();
    cycle.tick(60_000);
    expect(state.getMinutesOfDay()).toBeGreaterThan(start);
  });

  it('jumps to the next phase', () => {
    const state = GameState.getInstance();
    const cycle = new DayCycle();
    cycle.jumpTo('night');
    expect(state.getPhase()).toBe('night');
    expect(Math.floor(state.getMinutesOfDay())).toBe(config.nightStartMinute);
    cycle.jumpTo('day');
    expect(state.getPhase()).toBe('day');
    expect(Math.floor(state.getMinutesOfDay())).toBe(config.dayStartMinute);
  });
});
