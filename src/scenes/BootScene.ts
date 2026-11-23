import Phaser from 'phaser';
import { ASSET_MANIFEST, IMAGE_CATEGORIES, type AudioCategory } from '../assets/AssetManifest';
import { Assets } from '../assets/Assets';
import { Audio } from '../assets/Audio';
import { Placeholders } from '../assets/Placeholders';
import { GameState } from '../core/GameState';

interface ManifestFile {
  key: string;
  url: string;
  kind: 'image' | 'audio';
}

const AUDIO_CATEGORIES: readonly AudioCategory[] = ['sfx', 'music'];

/**
 * Loads every manifest file, replaces missing images with placeholders, loads the save, starts the game.
 * A missing file is recorded in `missing`, never thrown.
 */
export class BootScene extends Phaser.Scene {
  private readonly missing = new Set<string>();

  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.missing.add(file.key);
    });
  }

  create(): void {
    const files: ManifestFile[] = [];
    for (const category of IMAGE_CATEGORIES) {
      for (const id of ASSET_MANIFEST[category]) {
        files.push({ key: Assets.key(category, id), url: `assets/${category}/${id}.png`, kind: 'image' });
      }
    }
    for (const category of AUDIO_CATEGORIES) {
      for (const id of ASSET_MANIFEST[category]) {
        files.push({ key: Assets.key(category, id), url: `assets/${category}/${id}.ogg`, kind: 'audio' });
      }
    }

    // Ask the server which files exist first, so a missing file never reaches the loader
    // (Phaser would log an error for each one). See NOTES.md, "Open questions".
    void Promise.all(files.map((file) => this.probe(file))).then((present) => {
      const found = files.filter((_, i) => present[i]);
      for (const file of files) if (!found.includes(file)) this.missing.add(file.key);
      if (found.length === 0) {
        this.finish(files);
        return;
      }
      for (const file of found) {
        if (file.kind === 'image') this.load.image(file.key, file.url);
        else this.load.audio(file.key, file.url);
      }
      this.load.once(Phaser.Loader.Events.COMPLETE, () => this.finish(files));
      this.load.start();
    });
  }

  /** True when the url answers with a file of the right kind. Dev servers answer unknown paths with the HTML page. */
  private async probe(file: ManifestFile): Promise<boolean> {
    try {
      const response = await fetch(file.url, { method: 'HEAD', cache: 'no-cache' });
      const type = response.headers.get('content-type') ?? '';
      const matches = file.kind === 'image' ? type.startsWith('image/') : type.startsWith('audio/') || type.includes('ogg');
      return response.ok && matches;
    } catch {
      return false;
    }
  }

  private finish(files: readonly ManifestFile[]): void {
    for (const file of files) {
      if (file.kind !== 'image') continue;
      if (this.textures.exists(file.key)) {
        // Art is pixel art: keep its edges hard when the game scales it.
        this.textures.get(file.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      } else {
        // Anything that still has no texture (failed to load or to decode) gets a placeholder too.
        this.missing.add(file.key);
      }
    }
    Placeholders.generateMissing(this, this.missing);
    Audio.init(this.sound, this.cache.audio);
    GameState.getInstance().load();
    this.scene.launch('UIScene');
    this.scene.start('FarmScene');
  }
}
