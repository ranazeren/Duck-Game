const fs = require('fs');
const edit = (file, pairs) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(file + ' missing: ' + a.slice(0, 70));
    s = s.split(a).join(b);
  }
  fs.writeFileSync(file, s);
};

edit('src/scenes/sceneHelpers.ts', [
  ["import type { Being } from '../patterns/factory/Being';", "import { arrivalPoint, reachedEdge, type EdgeSide } from '../content/mapEdges';\nimport type { Being } from '../patterns/factory/Being';"],
  ["/**\n * Adds the scene's full-screen background", `/**
 * Stardew-style map change: call every frame. When the duck walks into the given screen edge, the map
 * fades out and the target scene starts with the duck just inside its opposite edge, at the same height
 * (kept between minY and maxY, the walkable ground of the target map).
 */
export function checkEdgeExit(
  scene: Phaser.Scene,
  sprite: Phaser.Physics.Arcade.Sprite,
  side: EdgeSide,
  targetScene: string,
  minY: number,
  maxY: number,
): void {
  if (isFading(scene) || !sprite.body) return;
  if (!reachedEdge(side, sprite.x, sprite.body.velocity.x)) return;
  const at = arrivalPoint(side, sprite.y, minY, maxY);
  transitionTo(scene, targetScene, { spawnX: at.x, spawnY: at.y });
}

/** A faint arrow at the screen edge that leads to another map. */
export function addEdgeCue(scene: Phaser.Scene, side: EdgeSide): void {
  const cue = scene.add
    .text(side === 'right' ? config.gameWidth - 12 : 12, config.gameHeight / 2, side === 'right' ? '›' : '‹', {
      fontFamily: config.fontFamily,
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5)
    .setAlpha(0.35)
    .setDepth(25);
  scene.tweens.add({ targets: cue, alpha: 0.8, x: cue.x + (side === 'right' ? -6 : 6), duration: 700, yoyo: true, repeat: -1 });
}

/**
 * Adds the scene's full-screen background`],
]);

edit('src/scenes/FarmScene.ts', [
  ["  addBackground,\n  addHint,", "  addBackground,\n  addEdgeCue,\n  addHint,\n  checkEdgeExit,"],
  ["    addEntrance(this, this.avatar.sprite, 820, 400, 'to_pond', 'Pond', { targetScene: 'PondScene', spawnX: 170, spawnY: 450 });\n", "    // The right edge of the farm leads to the pond.\n    addEdgeCue(this, 'right');\n"],
  ["    this.add.tileSprite(196, 384, 608, 32,", "    this.add.tileSprite(196, 384, 764, 32,"],
  ["Talk to the animals to earn furniture, or buy things at the barn'", "Talk to the animals for furniture, or buy things at the barn        Right edge: the pond'"],
  ["    this.avatar.update(isFading(this) || this.talking);\n", "    this.avatar.update(isFading(this) || this.talking);\n    checkEdgeExit(this, this.avatar.sprite, 'right', 'PondScene', 150, config.gameHeight - 30);\n"],
]);

edit('src/scenes/PondScene.ts', [
  ["  addBackground,\n  addEntrance,\n  addHint,", "  addBackground,\n  addEdgeCue,\n  addHint,\n  checkEdgeExit,"],
  ["    addEntrance(this, this.avatar.sprite, 60, 450, 'to_farm', 'Farm', { targetScene: 'FarmScene', spawnX: 720, spawnY: 400 });\n", "    // The left edge of the pond leads back to the farm.\n    addEdgeCue(this, 'left');\n"],
  ["You can swim.');", "You can swim. Left edge: the farm.');"],
  ["    this.avatar.update(isFading(this) || this.engaged || this.prompt !== null);\n", "    this.avatar.update(isFading(this) || this.engaged || this.prompt !== null);\n    checkEdgeExit(this, this.avatar.sprite, 'left', 'FarmScene', 144, config.gameHeight - 30);\n"],
]);

edit('src/assets/AssetManifest.ts', [
  ["entrance: ['to_house', 'to_pond', 'to_farm', 'box_exit', 'to_shop'],", "entrance: ['to_house', 'box_exit', 'to_shop'],"],
]);

// The generator no longer draws the pond sign or the farm door.
let g = fs.readFileSync('tools/generate-assets.mjs', 'utf8').replace(/\r\n/g, '\n');
for (const line of ["save('entrance', 'to_farm', door('#4f9a4a', '#35713a'), 4);\n", "save('entrance', 'to_pond', lakeSign(), 4);"]) {
  if (!g.includes(line)) throw new Error('generator missing ' + line);
  g = g.replace(line, '');
}
fs.writeFileSync('tools/generate-assets.mjs', g);

edit('README.md', [
  ['| `entrance` | doors and paths between scenes | 48 x 64 | `to_house`, `to_pond`, `to_farm` |', '| `entrance` | doors of buildings (outdoor maps join at their screen edges, no door) | 48 x 64 | `to_house`, `box_exit`, `to_shop` |'],
]);
console.log('ok');
