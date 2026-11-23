import { ASSET_MANIFEST, type Category } from './AssetManifest';

/** All code asks for art through `Assets.key`. No scene references a texture key directly. */
export class Assets {
  static key(category: Category, id: string): string {
    if (import.meta.env.DEV && !Assets.has(category, id)) {
      throw new Error(`[Assets] "${category}/${id}" is not in AssetManifest.ts. Add the id there first.`);
    }
    return `${category}/${id}`;
  }

  static has(category: Category, id: string): boolean {
    return ASSET_MANIFEST[category].includes(id);
  }
}
