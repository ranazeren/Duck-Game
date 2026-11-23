import type Phaser from 'phaser';
import type { AudioCategory } from './AssetManifest';
import { Assets } from './Assets';

const SETTINGS_KEY = 'duck-game-settings-v1';
const DEFAULT_VOLUME = 0.7;
const BLIP_NOTES = [330, 392, 440, 523, 587, 659];

/** Volume is kept in whole percent steps: 0, 0.01, ... 1. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

function loadVolume(): number {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(SETTINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const volume = (parsed as { volume?: unknown } | null)?.volume;
    return typeof volume === 'number' && Number.isFinite(volume) ? clamp01(volume) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

/**
 * The one door for sound effects and music, and the owner of the volume setting. Plain helper, no pattern.
 * A sound whose file exists is played through Phaser's sound manager. A missing sound effect gets a
 * placeholder, like missing images do: a short generated beep, logged once. Missing music stays silent.
 */
export class Audio {
  private static sound: Phaser.Sound.BaseSoundManager | null = null;
  private static cache: Phaser.Cache.BaseCache | null = null;
  private static music: string | null = null;
  private static volume = loadVolume();
  private static readonly logged = new Set<string>();
  private static context: AudioContext | null = null;

  /** Called once by BootScene with the game's sound manager and audio cache. */
  static init(sound: Phaser.Sound.BaseSoundManager, cache: Phaser.Cache.BaseCache): void {
    Audio.sound = sound;
    Audio.cache = cache;
    sound.volume = Audio.volume;
  }

  /** 0 (silent) to 1, in steps of 0.01. */
  static getVolume(): number {
    return Audio.volume;
  }

  static setVolume(volume: number): void {
    Audio.volume = clamp01(volume);
    if (Audio.sound) Audio.sound.volume = Audio.volume;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volume: Audio.volume }));
    } catch {
      // Storage unavailable: the volume simply lasts until the page closes.
    }
  }

  static play(category: AudioCategory, id: string): void {
    const key = Assets.key(category, id);
    if (Audio.sound && Audio.cache?.exists(key)) {
      if (category === 'sfx') {
        Audio.sound.play(key);
      } else if (Audio.music !== key) {
        if (Audio.music) Audio.sound.stopByKey(Audio.music);
        Audio.music = key;
        Audio.sound.play(key, { loop: true });
      }
      return;
    }
    if (!Audio.logged.has(key)) {
      Audio.logged.add(key);
      console.info(`[Audio] placeholder: ${key}`);
    }
    if (category === 'sfx') Audio.blip(id);
  }

  /** Placeholder sound effect: a short square-wave note chosen from the id. */
  private static blip(id: string): void {
    if (Audio.volume <= 0 || typeof AudioContext === 'undefined') return;
    try {
      Audio.context ??= new AudioContext();
      const ctx = Audio.context;
      const note = BLIP_NOTES[[...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % BLIP_NOTES.length];
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = note;
      gain.gain.setValueAtTime(0.12 * Audio.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.13);
    } catch {
      // Sound is never worth breaking the game for.
    }
  }
}
