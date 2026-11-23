/** Every tunable number of the game lives here (guide rule 9). */
export const config = {
  // Screen
  gameWidth: 960,
  gameHeight: 540,
  fadeMs: 300,
  // Text and panel colors. Every text/background pair is checked against WCAG 2.1 AA (4.5:1) by tests/ui/contrast.test.ts.
  colors: {
    text: '#ffffff',
    textMuted: '#c9d3de',
    panel: '#10131c',
    row: '#1b2030',
    rowSelected: '#2d4a7a',
    accent: '#ffe066',
    good: '#7bed9f',
    button: '#000000',
    buttonHover: '#262626',
    focus: '#ffe066',
    buttonSelected: '#8a5a00',
  },
  // The barn shop has its own warm wood colors. Pairs are checked by tests/ui/contrast.test.ts.
  shopColors: {
    panel: '#3a2412',
    row: '#5a3a1e',
    rowSelected: '#8a5a00',
    text: '#ffffff',
    muted: '#fff3d6',
    accent: '#ffe066',
    good: '#c9ffd6',
  },
  fontFamily: '"Segoe UI", "Trebuchet MS", Verdana, sans-serif',

  // Clock
  realMinutesPerDay: 10,
  startMinutesOfDay: 8 * 60,
  dayStartMinute: 6 * 60,
  nightStartMinute: 18 * 60,
  skyTweenMs: 1000,

  // Player
  playerSpeed: 120,
  startingCoins: 40,
  // Move speed is `playerSpeed` (pixels per second); attack speed decides who acts first when two moves tie.
  duck: { maxHp: 20, attack: 3, attackSpeed: 10, maxStamina: 10 },
  // No outfits and no furniture at the start: outfits come from the barn shop, furniture from the farm animals
  // (content/farmAnimals.ts) or the shop.
  startingInventory: { berry: 2 } as Record<string, number>,

  // Outfits and items
  outfitBonus: { hat: 1, sweater: 2, rapper: 3, cone_hat: 0, gloves: 0 },
  // Speed bonuses of outfits: moveSpeed in pixels per second, attackSpeed in turn-order points.
  outfitSpeed: {
    cone_hat: { moveSpeed: 30, attackSpeed: 0 },
    gloves: { moveSpeed: 0, attackSpeed: 4 },
  } as Record<string, { moveSpeed: number; attackSpeed: number }>,
  heal: { berry: 5, bread: 10 },
  stamina: { corn: 4, seed_cake: 8 },
  defaultGift: 'berry',

  // House: the floor is a grid of cells, and every cell is one slot (id "c<col>r<row>").
  houseGrid: { cell: 64, originX: 0, originY: 156, cols: 15, rows: 6 },

  // Battle
  // Moves cost stamina, so the strongest move cannot be used every turn. Stamina is full at the start of a
  // fight and comes back a little every turn; some food restores more (see `stamina` below).
  staminaCost: { peck: 4, quack: 1 },
  staminaRegen: 2,
  quackFactor: 0.6,
  fleeChance: 1,
  dropChance: 0.5,
  loseHpFraction: 0.5,
  // Losing a fight costs this fraction of the coins held, and the duck wakes up at home.
  loseCoinsFraction: 0.25,
  battleResultMs: 1500,
  battleLogStepMs: 450,

  // Undertale-style meetings: a being that follows the duck and catches it starts the encounter by itself,
  // and the encounter is a fight with this probability, a friendly meeting otherwise.
  catchFightChance: 0.5,
  // How long the hint line at the bottom of a map stays, in seconds.
  hintSeconds: 7,

  // Pond and spawning
  spawnIntervalSec: 8,
  // angerChance (in the beings table): chance that befriending it makes it angry and starts a fight instead.
  // followChance (in the beings table): each spawned being follows the duck with this probability;
  // approachSpeed is how fast it walks toward the duck then, in pixels per second.
  bossCoinScale: 100,
  bossStatMultiplier: 2,
  bossWeight: 5,
  bossMinCoins: 50,
  beings: {
    wild_duck: { name: 'Wild Duck', maxHp: 10, attack: 2, reward: 3, drop: 'berry', weight: 70, followChance: 0.3, approachSpeed: 20, attackSpeed: 6, angerChance: 0.15 },
    trash_mob: { name: 'Trash Mob', maxHp: 14, attack: 3, reward: 4, drop: 'bread', weight: 30, followChance: 0.7, approachSpeed: 18, attackSpeed: 4, angerChance: 0.35 },
    ghost: { name: 'Ghost', maxHp: 12, attack: 3, reward: 5, drop: 'berry', weight: 60, followChance: 0.8, approachSpeed: 26, attackSpeed: 9, angerChance: 0.1 },
    robot_duck: { name: 'Robot Duck', maxHp: 16, attack: 4, reward: 6, drop: 'bread', weight: 40, followChance: 0.4, approachSpeed: 22, attackSpeed: 12, angerChance: 0.3 },
    // The guardian of the reeds. It is not drawn from the spawn tables: it stands in the reed bed (see ReedGuardian).
    // Meant to be out of reach for the bare duck: it needs outfits, food and some coins first.
    reed_guardian: { name: 'Reed Warden', maxHp: 80, attack: 4, reward: 45, drop: 'seed_cake', weight: 0, followChance: 0, approachSpeed: 0, attackSpeed: 11, angerChance: 0, dropChance: 1 },
    // The Frog King, the guardian of the forest. An easier boss than the Reed Warden: the bare duck can win
    // with a little food, and any outfit makes it simple.
    frog_king: { name: 'Frog King', maxHp: 35, attack: 3, reward: 25, drop: 'corn', weight: 0, followChance: 0, approachSpeed: 0, attackSpeed: 8, angerChance: 0, dropChance: 1 },
  },
  // How many day/night changes the guardian stays away after it was beaten (2 is one full day).
  guardianRespawnChanges: 2,

  // The barn shop: prices in coins. Outfits and furniture are bought once, food again and again.
  shop: {
    outfit: { hat: 15, sweater: 25, rapper: 45, cone_hat: 30, gloves: 30 },
    furniture: { chair: 20, table: 25, lamp: 30, rug: 20, disco_ball: 80 },
    consumable: { berry: 5, bread: 10, corn: 8, seed_cake: 14 },
  } as Record<'outfit' | 'furniture' | 'consumable', Record<string, number>>,

  // Saving and misc
  autosaveSec: 30,
  toastMs: 2500,
  debugCoins: 25,
};

export type BeingId = keyof typeof config.beings;
