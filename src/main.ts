import Phaser from 'phaser';
import { Placeholders } from './assets/Placeholders';
import { config } from './config';
import { GameState } from './core/GameState';
import { SAVE_KEY } from './core/SaveSystem';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { FarmScene } from './scenes/FarmScene';
import { ForestScene } from './scenes/ForestScene';
import { HouseScene } from './scenes/HouseScene';
import { PondScene } from './scenes/PondScene';
import { ShopScene } from './scenes/ShopScene';
import { getDayCycle } from './scenes/sceneHelpers';
import { UIScene } from './scenes/UIScene';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'app',
  width: config.gameWidth,
  height: config.gameHeight,
  backgroundColor: '#14161c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, FarmScene, HouseScene, PondScene, ForestScene, BattleScene, ShopScene, UIScene],
});

// The save also happens every 30 seconds and on every scene change; this catches a closed tab.
let saveOnExit = true;
window.addEventListener('pagehide', () => {
  if (saveOnExit && game.scene.isActive('UIScene')) GameState.getInstance().save();
});

if (import.meta.env.DEV) installDebugHelpers();

/** Development builds only: F2 lists placeholder ids, T jumps to the next phase, C adds coins, Shift+N starts over. */
function installDebugHelpers(): void {
  const overlay = document.createElement('pre');
  overlay.style.cssText =
    'position:fixed;top:8px;left:8px;margin:0;padding:10px 14px;max-height:90vh;overflow:auto;' +
    'background:rgba(0,0,0,.85);color:#9f9;font:12px monospace;z-index:10;display:none';
  document.body.appendChild(overlay);

  window.addEventListener('keydown', (event) => {
    if (event.code === 'F2') {
      event.preventDefault();
      const keys = Placeholders.generated;
      overlay.textContent = `Assets still using a placeholder (${keys.length}):\n` + keys.map((k) => `  public/assets/${k}.png`).join('\n');
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    } else if (event.code === 'KeyT') {
      getDayCycle(game)?.jumpTo(GameState.getInstance().getPhase() === 'day' ? 'night' : 'day');
    } else if (event.code === 'KeyC') {
      GameState.getInstance().addCoins(config.debugCoins);
    } else if (event.code === 'KeyN' && event.shiftKey) {
      // Shift+N: delete the save and start a new game.
      saveOnExit = false;
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  });

  // Console access for manual checks.
  Object.assign(window, { duckGame: { game, GameState, Placeholders } });
}
