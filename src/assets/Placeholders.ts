import Phaser from 'phaser';
import { config } from '../config';
import { IMAGE_CATEGORIES, type ImageCategory } from './AssetManifest';

interface PlaceholderStyle {
  width: number;
  height: number;
  color: number;
  /** Draw only an outline, so layers underneath stay visible (outfits). */
  outline?: boolean;
  /** Draw a grid line along two edges, so tiles read as tiles. */
  grid?: boolean;
  /** Put the label near the top instead of the center (backgrounds). */
  labelTop?: boolean;
  /** Per-id colors; ids not listed use `color`. */
  colorById?: Record<string, number>;
}

/** Default size and look per category. A new image category needs one row here. */
const STYLES: Record<ImageCategory, PlaceholderStyle> = {
  player: { width: 48, height: 48, color: 0xf2c53d },
  being: { width: 64, height: 64, color: 0xc0392b },
  animal: { width: 48, height: 48, color: 0x16a085 },
  decor: { width: 48, height: 48, color: 0x27ae60 },
  outfit: { width: 48, height: 48, color: 0x2ecc71, outline: true },
  item: { width: 32, height: 32, color: 0x2e86de },
  background: {
    width: config.gameWidth,
    height: config.gameHeight,
    color: 0x3b4252,
    labelTop: true,
    colorById: { farm: 0x8fc1e3, house: 0x8d6e63, pond: 0x9ad1d4, battle: 0x4a3f55 },
  },
  ground: {
    width: 32,
    height: 32,
    color: 0x7f8c8d,
    grid: true,
    colorById: { grass: 0x5da130, dirt: 0x9b7653, water: 0x3a7bd5, floor: 0xc8a97e },
  },
  entrance: { width: 48, height: 64, color: 0x8e44ad },
  ui: { width: 24, height: 24, color: 0x7f8c8d },
};

function isImageCategory(category: string): category is ImageCategory {
  return (IMAGE_CATEGORIES as readonly string[]).includes(category);
}

/** Generates a labeled stand-in texture for every asset whose file is missing. */
export class Placeholders {
  private static readonly generatedKeys: string[] = [];

  /** Keys currently shown as placeholders (for the F2 overlay). */
  static get generated(): readonly string[] {
    return Placeholders.generatedKeys;
  }

  static generateMissing(scene: Phaser.Scene, missing: ReadonlySet<string>): void {
    for (const key of missing) {
      const [category, id] = key.split('/');
      if (!id || !isImageCategory(category) || scene.textures.exists(key)) continue;
      Placeholders.draw(scene, key, id, STYLES[category]);
      Placeholders.generatedKeys.push(key);
    }
  }

  private static draw(scene: Phaser.Scene, key: string, id: string, style: PlaceholderStyle): void {
    const { width, height } = style;
    const color = style.colorById?.[id] ?? style.color;

    const g = scene.make.graphics({}, false);
    if (style.outline) {
      g.lineStyle(4, color, 1);
      g.strokeRect(2, 2, width - 4, height - 4);
    } else {
      g.fillStyle(color, 1);
      g.fillRect(0, 0, width, height);
      g.lineStyle(2, 0x000000, style.grid ? 0.25 : 0.6);
      if (style.grid) {
        g.lineBetween(0, 1, width, 1);
        g.lineBetween(1, 0, 1, height);
      } else {
        g.strokeRect(1, 1, width - 2, height - 2);
      }
    }

    const small = Math.min(width, height) <= 64;
    const label = scene.make.text(
      {
        x: 0,
        y: 0,
        text: small ? id.replace(/_/g, '\n') : id,
        style: {
          fontFamily: 'monospace',
          fontSize: small ? `${Math.max(8, Math.floor(Math.min(width, height) / 5))}px` : '22px',
          color: style.outline ? '#0b5d2a' : '#ffffff',
          stroke: style.outline ? '#ffffff' : '#000000',
          strokeThickness: 2,
          align: 'center',
        },
      },
      false,
    );
    label.setOrigin(0.5, style.outline || style.labelTop ? 0 : 0.5);

    // Bake the box and its label into one texture stored under the asset's own key.
    const texture = scene.textures.addDynamicTexture(key, width, height, false);
    if (texture) {
      const labelY = style.labelTop ? 44 : style.outline ? 5 : height / 2;
      texture.draw(g, 0, 0);
      if (!style.grid) texture.draw(label, width / 2, labelY);
      texture.render();
    }
    g.destroy();
    label.destroy();
  }
}
