// Generates the game's pixel-art PNGs into public/assets/<category>/<id>.png.
// Run with:  npm run assets
// Every sprite is drawn on a small grid and scaled up by a whole number, so pixels stay crisp.
// The files are ordinary PNGs: an artist can replace any of them by hand (running this script again overwrites them).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

// --- tiny image library ------------------------------------------------------

function hex(color, alpha = 255) {
  const n = parseInt(color.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
}

class Img {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }
  set(x, y, c) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data.set(typeof c === 'string' ? hex(c) : c, (y * this.w + x) * 4);
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  frame(x, y, w, h, c) {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let j = Math.floor(cy - ry); j <= cy + ry; j++)
      for (let i = Math.floor(cx - rx); i <= cx + rx; i++)
        if (((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1) this.set(i, j, c);
  }
  scaled(n) {
    const out = new Img(this.w * n, this.h * n);
    for (let y = 0; y < out.h; y++)
      for (let x = 0; x < out.w; x++) {
        const s = (Math.floor(y / n) * this.w + Math.floor(x / n)) * 4;
        out.data.set(this.data.subarray(s, s + 4), (y * out.w + x) * 4);
      }
    return out;
  }
  png() {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 4 + 1)] = 0;
      Buffer.from(this.data.buffer, y * this.w * 4, this.w * 4).copy(raw, y * (this.w * 4 + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let c = 0xffffffff;
  for (const byte of body) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE((c ^ 0xffffffff) >>> 0);
  return Buffer.concat([len, body, crc]);
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let written = 0;
function save(category, id, img, scale) {
  const file = join(OUT, category, `${id}.png`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, img.scaled(scale).png());
  written += 1;
}

// --- sprites drawn as text ---------------------------------------------------

/** One character is one pixel. '.' is transparent. */
const PALETTE = {
  K: '#1b1b26', // outline
  W: '#f4f4f4',
  w: '#cfd8e6',
  Y: '#f7d038',
  y: '#e0a820',
  O: '#f08a24',
  R: '#d8343c',
  r: '#a02030',
  G: '#3fa34d',
  g: '#2c7a3a',
  B: '#8a5a2b',
  b: '#6b4420',
  T: '#c98a3c',
  t: '#8a5a22',
  C: '#f2deb0',
  S: '#8d99a6',
  s: '#6c7885',
  L: '#aab4bf',
  D: '#4a4f5a',
  M: '#b8c0cc',
  m: '#7f8896',
  A: '#f0b030',
  P: '#7b4bb8',
  p: '#5a3590',
  U: '#3a7bd5',
  u: '#2a5aa8',
  N: '#f4a6b0', // pink
  Z: '#d6f58a', // pale green
  H: '#6fc04a', // light leaf green
  J: '#1e7a3a', // dark leaf green
  I: '#59d2f0', // light blue
  Q: '#e8785e', // salmon (squirrel)
  n: '#d98a9a', // dark pink (pig)
};

function sprite(rows, size = 16) {
  const img = new Img(size, size);
  rows.forEach((row, y) => {
    if (row.length > size || y >= size) throw new Error(`sprite row ${y} is too long: "${row}"`);
    [...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return;
      if (!PALETTE[ch]) throw new Error(`unknown palette character "${ch}"`);
      img.set(x, y, PALETTE[ch]);
    });
  });
  return img;
}

const mirror = (rows, size = 16) => rows.map((row) => [...row.padEnd(size, '.')].reverse().join(''));

/** Replaces characters row by row: `map(y)` returns { from: to } for that row. */
const recolor = (rows, map) => rows.map((row, y) => [...row].map((ch) => map(y)[ch] ?? ch).join(''));

function put(rows, x, y, ch) {
  const copy = rows.map((row) => row.padEnd(16, '.'));
  copy[y] = copy[y].slice(0, x) + ch + copy[y].slice(x + ch.length);
  return copy;
}

/** Moves the drawn pixels to the middle of the grid (used to turn an outfit layer into an icon). */
function centered(rows, size = 16) {
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && cells.push([x, y, ch])));
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const dx = Math.floor((size - (Math.max(...xs) - Math.min(...xs) + 1)) / 2) - Math.min(...xs);
  const dy = Math.floor((size - (Math.max(...ys) - Math.min(...ys) + 1)) / 2) - Math.min(...ys);
  const grid = Array.from({ length: size }, () => Array(size).fill('.'));
  for (const [x, y, ch] of cells) grid[y + dy][x + dx] = ch;
  return grid.map((row) => row.join(''));
}

const DUCK = [
  '................',
  '......KKKK......',
  '.....KYYYYK.....',
  '....KYYYYYYK....',
  '....KYYYYKYK....',
  '....KYYYYYYOOO..',
  '....KYYYYYYOO...',
  '.....KYYYYK.....',
  '...KKYYYYYYK....',
  '..KYYYYYYYYYK...',
  '.KYYYyyyYYYYK...',
  '.KYYyyyyyYYYK...',
  '.KYYYyyyYYYYK...',
  '..KYYYYYYYYK....',
  '...KKKKKKKK.....',
  '....OO..OO......',
];

// Outfit layers share the duck's grid, so they line up when stacked on it.
const HAT = [
  '.....pPPPPp.....',
  '.....pPPPPp.....',
  '.....YYYYYY.....',
  '...pPPPPPPPPp...',
];

const SWEATER = [
  '', '', '', '', '', '', '', '',
  '.....WWWWWW.....',
  '...UUUUUUUUU....',
  '..uuuuuuuuuu....',
  '..UUUUUUUUUU....',
  '..uuuuuuuuuu....',
  '...UUUUUUUU.....',
];

const RAPPER = [
  '', '', '', '',
  '......KKWKKK....',
  '', '', '',
  '.....A....A.....',
  '......A..A......',
  '.......AA.......',
  '......AAAA......',
  '.......AA.......',
];

const WILD_DUCK = mirror(
  recolor(DUCK, (y) => (y <= 6 ? { Y: 'G' } : y === 7 ? { Y: 'W' } : { Y: 'B', y: 'b' })),
);

let robot = recolor(DUCK, () => ({ Y: 'M', y: 'm', O: 'A' }));
robot = put(robot, 9, 4, 'R'); // red eye
robot = put(robot, 7, 0, 'R'); // antenna light
robot = put(robot, 7, 1, 'D');
robot = put(robot, 3, 9, 'D'); // rivets
robot = put(robot, 11, 9, 'D');
robot = put(robot, 3, 13, 'D');
robot = put(robot, 10, 13, 'D');
robot = put(robot, 4, 15, 'DD..DD');
const ROBOT_DUCK = mirror(robot);

const TRASH_MOB = [
  '................',
  '......KKKKK.....',
  '...KKKKKKKKKKK..',
  '...KLLLLLLLLLK..',
  '...KKKKKKKKKKK..',
  '....KSSSSSSSK...',
  '....KSWKSSWKK...',
  '..OOOSSSSSSSK...',
  '...OOSsSsSsSK...',
  '....KSsSsSsSK...',
  '....KSsSsSsSK...',
  '....KSsSsSsSK...',
  '....KSSSSSSSK...',
  '....KKKKKKKKK...',
  '.....OO...OO....',
];

const GHOST = [
  '................',
  '.....KKKKKK.....',
  '...KKWWWWWWKK...',
  '..KWWWWWWWWWWK..',
  '..KWWWWWWWWWWK..',
  '.KWWKKWWWKKWWWK.',
  '.KWWKKWWWKKWWWK.',
  '.KWWWWWWWWWWWWK.',
  '.KWWWWWKKWWWWWK.',
  '.KWWWWWKKWWWWWK.',
  '.KWWWWWWWWWWWWK.',
  '.KWWWWWWWWWWwwK.',
  '.KWWWWWWWWWwwwK.',
  '.KWWWKWWWWKWwwK.',
  '.KWWK.KWWK.KwwK.',
  '..KK...KK...KK..',
];

const BERRY = [
  '................',
  '........GG......',
  '.......GG.......',
  '......KGK.......',
  '....KKRRRKK.....',
  '...KRRRRRRRK....',
  '..KRRWRRRRRRK...',
  '..KRWRRRRRRRK...',
  '..KRRRRRRRRRK...',
  '..KRRRRRRRRRK...',
  '..KRRRRRRRrRK...',
  '...KRRRRRrRK....',
  '....KKRRRKK.....',
  '......KKK.......',
];

const BREAD = [
  '', '', '',
  '....KKKKKKKK....',
  '..KKTTTTTTTTKK..',
  '.KTTtTTtTTtTTTK.',
  '.KTTtTTtTTtTTTK.',
  '.KTTTTTTTTTTTTK.',
  '.KCCCCCCCCCCCCK.',
  '.KCCCCCCCCCCCCK.',
  '.KCCCCCCCCCCCCK.',
  '..KKKKKKKKKKKK..',
];

const CHAIR = [
  '................',
  '...KKK..........',
  '...KBK..........',
  '...KBK..........',
  '...KBK..........',
  '...KBK..........',
  '...KBK..........',
  '...KBKKKKKKKK...',
  '...KBTTTTTTTK...',
  '...KKKKKKKKKK...',
  '...KBK....KBK...',
  '...KBK....KBK...',
  '...KBK....KBK...',
  '...KBK....KBK...',
  '...KKK....KKK...',
];

const LAMP = [
  '................',
  '.....KKKKKK.....',
  '....KYYYYYYK....',
  '...KYYYYYYYYK...',
  '..KYYYYYYYYYYK..',
  '..KKKKKKKKKKKK..',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.......KK.......',
  '.....KKKKKK.....',
  '....KDDDDDDK....',
  '....KKKKKKKK....',
];

const RUG = [
  '', '', '', '',
  '.KKKKKKKKKKKKKK.',
  '.KRRRRRRRRRRRRK.',
  '.KRYYYYYYYYYYRK.',
  '.KRYRRRRRRRRYRK.',
  '.KRYRRYYYYRRYRK.',
  '.KRYRRRRRRRRYRK.',
  '.KRYYYYYYYYYYRK.',
  '.KRRRRRRRRRRRRK.',
  '.KKKKKKKKKKKKKK.',
];

const COIN = [
  '....KKKK....',
  '..KKAAAAKK..',
  '.KAAWAAAAAK.',
  '.KAWAAAAAAK.',
  'KAAAAAyyAAAK',
  'KAAAAyAAAAAK',
  'KAAAAyAAAAAK',
  'KAAAAAyyAAAK',
  '.KAAAAAAAAK.',
  '.KAAAAAAAyK.',
  '..KKAAAAKK..',
  '....KKKK....',
];

const SUN = [
  '.....YY.....',
  '.Y...YY...Y.',
  '..Y......Y..',
  '....YYYY....',
  '...YYYYYY...',
  'YY.YYYYYY.YY',
  'YY.YYYYYY.YY',
  '...YYYYYY...',
  '....YYYY....',
  '..Y......Y..',
  '.Y...YY...Y.',
  '.....YY.....',
];

const MOON = [
  '....WWWW....',
  '..WWWWW.....',
  '.WWWWW......',
  '.WWWW.......',
  'WWWWW.......',
  'WWWWW.......',
  'WWWWW.......',
  'WWWWWW.....W',
  '.WWWWWW...WW',
  '.WWWWWWWWWW.',
  '..WWWWWWWW..',
  '....WWWW....',
];

const BAG = [
  '....KKKK....',
  '...K....K...',
  '..KKKKKKKK..',
  '.KBBBBBBBBK.',
  '.KBBBBBBBBK.',
  'KBBKKKKKKBBK',
  'KBBKYYYYKBBK',
  'KBBKKKKKKBBK',
  'KBBBBBBBBBBK',
  'KBBBBBBBBBBK',
  '.KBBBBBBBBK.',
  '..KKKKKKKK..',
];

save('player', 'duck_base', sprite(DUCK), 3);
save('outfit', 'hat', sprite(HAT), 3);
save('outfit', 'sweater', sprite(SWEATER), 3);
save('outfit', 'rapper', sprite(RAPPER), 3);

save('being', 'wild_duck', sprite(WILD_DUCK), 4);
save('being', 'trash_mob', sprite(TRASH_MOB), 4);
save('being', 'ghost', sprite(GHOST), 4);
save('being', 'robot_duck', sprite(ROBOT_DUCK), 4);

save('item', 'berry', sprite(BERRY), 2);
save('item', 'bread', sprite(BREAD), 2);
save('item', 'chair', sprite(CHAIR), 2);
save('item', 'lamp', sprite(LAMP), 2);
save('item', 'rug', sprite(RUG), 2);
save('item', 'hat', sprite(centered(HAT)), 2);
save('item', 'sweater', sprite(centered(SWEATER)), 2);
save('item', 'rapper', sprite(centered(RAPPER)), 2);

save('ui', 'coin', sprite(COIN, 12), 2);
save('ui', 'sun', sprite(SUN, 12), 2);
save('ui', 'moon', sprite(MOON, 12), 2);
save('ui', 'inventory', sprite(BAG, 12), 2);

// --- cardboard palette -------------------------------------------------------

const CARD = { base: '#c4975a', rib: '#b0824a', light: '#d6aa6e', edge: '#8a5f30', tape: '#e8d9a8', dark: '#2a1c10' };

// --- ground tiles (16 x 16, seamless) ----------------------------------------

function speckled(seed, base, specks) {
  const img = new Img(16, 16);
  const rand = rng(seed);
  img.rect(0, 0, 16, 16, base);
  for (const [color, count] of specks)
    for (let i = 0; i < count; i++) img.set(Math.floor(rand() * 16), Math.floor(rand() * 16), color);
  return img;
}

/** A V-shaped sprout of grass with a little shadow. */
function sprout(img, x, y) {
  for (const [dx, dy] of [[0, 0], [0, 1], [1, 2], [3, 0], [3, 1], [2, 2]]) img.set(x + dx, y + dy, '#1e7a3a');
  img.set(x + 1, y + 3, '#6fa82f');
  img.set(x + 2, y + 3, '#6fa82f');
}
/** A white daisy with a yellow heart. */
function daisy(img, x, y) {
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) img.set(x + dx, y + dy, '#ffffff');
  img.set(x, y, '#f7d038');
}
/** The tiling grass (32 x 32, shown at x2): a bright green with sparse sprouts and a few daisies. */
function grassTile() {
  const img = new Img(32, 32);
  const rand = rng(1);
  img.rect(0, 0, 32, 32, '#8fc83c');
  for (let i = 0; i < 26; i++) img.set(Math.floor(rand() * 32), Math.floor(rand() * 32), ['#a4dc54', '#7fb533', '#d6ea8a'][Math.floor(rand() * 3)]);
  for (const [x, y] of [[4, 5], [19, 3], [11, 15], [25, 21], [3, 25], [16, 27]]) sprout(img, x, y);
  for (const [x, y] of [[10, 8], [24, 12], [7, 19]]) daisy(img, x, y);
  return img;
}
save('ground', 'grass', grassTile(), 2);
save('ground', 'dirt', speckled(2, '#9b7653', [['#7f5f42', 14], ['#b08a64', 8]]), 2);

const water = new Img(16, 16);
water.rect(0, 0, 16, 16, '#3a7bd5');
for (const [x, y, w] of [[1, 3, 4], [9, 6, 5], [3, 10, 5], [11, 13, 4]]) {
  water.rect(x, y, w, 1, '#7fb2f0');
  water.rect(x + 1, y + 1, w - 2, 1, '#2f69bd');
}
save('ground', 'water', water, 2);

// The house floor is the bottom of a cardboard box: corrugated ribs and a few scuffs.
const floor = speckled(3, '#c8955a', [['#d6a56a', 9], ['#b9854c', 9]]);
for (const y of [3, 7, 11, 15]) floor.rect(0, y, 16, 1, '#8a5a2b'); // the gaps between the boards
for (const [x, y] of [[5, 0], [12, 4], [3, 8], [10, 12]]) floor.rect(x, y, 1, 3, '#8a5a2b'); // where two boards meet
floor.rect(0, 0, 16, 1, '#6b4420');
save('ground', 'floor', floor, 2);

// --- entrances (12 x 16) -----------------------------------------------------

function door(main, dark) {
  const img = new Img(12, 16);
  img.rect(0, 0, 12, 16, PALETTE.K);
  img.rect(1, 1, 10, 15, main);
  img.frame(2, 2, 8, 5, dark);
  img.frame(2, 9, 8, 6, dark);
  img.rect(9, 8, 1, 1, PALETTE.A);
  return img;
}

/** A cardboard box lying on its side with the flaps open. `inside` shows its lit inside (the way out). */
function cardboardBox(inside) {
  const img = new Img(12, 16);
  // open top flaps
  img.rect(0, 1, 5, 4, PALETTE.K);
  img.rect(1, 2, 3, 2, CARD.light);
  img.rect(7, 1, 5, 4, PALETTE.K);
  img.rect(8, 2, 3, 2, CARD.light);
  // body
  img.rect(0, 5, 12, 11, PALETTE.K);
  img.rect(1, 5, 10, 10, CARD.base);
  for (const y of [7, 9, 11, 13]) img.rect(1, y, 10, 1, CARD.rib);
  img.rect(5, 4, 2, 5, CARD.tape); // tape across the seam
  img.rect(5, 4, 2, 1, PALETTE.K);
  // the opening
  img.rect(2, 8, 8, 8, PALETTE.K);
  img.rect(3, 9, 6, 7, inside ? '#7a5632' : CARD.dark);
  if (inside) img.rect(3, 14, 6, 2, CARD.base);
  return img;
}

function cottage() {
  // A cozy cottage: red shingle roof with a chimney, cream plaster with timber beams, a round attic window,
  // two windows with flower boxes and a wooden door on a stone step.
  const img = new Img(20, 20);
  const roof = '#b8433a';
  const roofDark = '#8f2f2b';
  const roofLight = '#d9604f';
  const timber = '#6b4420';
  const plaster = '#f2deb0';
  const stone = '#9aa0a8';
  const glass = '#9dd0f2';
  // chimney
  img.rect(14, 0, 3, 6, '#8d99a6');
  img.rect(14, 0, 3, 1, '#6c7885');
  img.rect(14, 3, 3, 1, '#6c7885');
  img.rect(15, 0, 1, 1, '#4a4f5a');
  // roof: a wide trapezoid of shingles
  for (let r = 0; r < 8; r++) {
    const half = 3 + r;
    for (let x = 10 - half; x < 10 + half; x++) {
      const shingle = (x + (r % 2) * 2) % 4 === 0;
      img.set(x, 2 + r, r === 0 ? roofLight : shingle ? roofDark : r % 3 === 2 ? roofDark : roof);
    }
  }
  img.rect(0, 10, 20, 1, roofDark); // the eaves
  img.rect(0, 11, 20, 1, '#5a2420');
  // round attic window
  img.ellipse(10, 6, 2.6, 2.6, timber);
  img.ellipse(10, 6, 1.6, 1.6, glass);
  // walls: plaster, timber frame, stone foot
  img.rect(2, 12, 16, 8, plaster);
  img.rect(2, 12, 16, 1, timber);
  img.rect(2, 12, 1, 8, timber);
  img.rect(17, 12, 1, 8, timber);
  img.rect(2, 18, 16, 2, stone);
  for (const x of [4, 8, 12, 15]) img.rect(x, 18, 1, 2, '#6c7885');
  img.rect(2, 18, 16, 1, '#b4bac0');
  // door on a step
  img.rect(8, 13, 5, 7, timber);
  img.rect(9, 14, 3, 6, '#a0683a');
  img.rect(10, 14, 1, 6, '#8a5a2b');
  img.rect(9, 14, 3, 1, '#c98a3c');
  img.set(11, 17, '#f0b030');
  img.rect(7, 19, 7, 1, '#b4bac0');
  // windows with crossbars and flower boxes
  for (const x of [3, 14]) {
    img.rect(x, 13, 4, 4, timber);
    img.rect(x + 1, 14, 2, 2, glass);
    img.set(x + 1, 14, '#ffffff');
    img.rect(x, 17, 4, 1, '#8a5a2b');
    img.set(x, 16, '#d8343c');
    img.set(x + 2, 16, '#ffffff');
    img.set(x + 3, 16, '#d8343c');
  }
  return img;
}
save('entrance', 'to_house', cottage(), 5);
function houseDoor() {
  const img = new Img(12, 16);
  img.rect(0, 0, 12, 16, '#3a2616');
  img.rect(1, 2, 10, 14, '#a0683a');
  for (const x of [4, 7]) img.rect(x, 2, 1, 14, '#6b4420');
  img.rect(3, 4, 6, 4, '#6b4420');
  img.rect(4, 5, 4, 2, '#9dd0f2');
  img.set(9, 10, '#f0b030');
  img.rect(2, 14, 8, 2, '#c0392b'); // the doormat
  img.rect(1, 0, 10, 2, '#5a3a1e');
  return img;
}
save('entrance', 'box_exit', houseDoor(), 4);

function tileRoof(img, x0, y0, w, h) {
  const teal = ['#1f8f86', '#26a69a', '#157a72'];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      let color = teal[(Math.floor(c / 3) + Math.floor(r / 2)) % 3];
      if (c % 3 === 2) color = '#157a72'; // the edge between two tiles
      if (r % 3 === 2) color = '#0f5b55'; // the underside of a row of tiles
      if (r === 0 && c % 3 === 0) color = '#4cc4b0'; // a glint on the top edge
      img.set(x0 + c, y0 + r, color);
    }
  }
}

function woodShop() {
  const img = new Img(28, 22);
  const wood = '#6b4420';
  const woodMid = '#8a5a2b';
  const woodLight = '#c98a3c';
  // two layers of teal tiled roof, with a beam under each
  tileRoof(img, 5, 0, 18, 4);
  img.rect(4, 4, 20, 1, woodMid);
  tileRoof(img, 1, 5, 26, 6);
  img.rect(1, 11, 26, 1, wood);
  // a few little white flowers growing on the roof
  for (const [x, y] of [[3, 7], [22, 6], [14, 2]]) {
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) img.set(x + dx, y + dy, '#ffffff');
    img.set(x, y, '#f7d038');
  }
  // the dark wooden back wall
  img.rect(4, 12, 20, 8, '#4a2f1a');
  for (const x of [8, 13, 18]) img.rect(x, 12, 1, 8, '#3a2616');
  // posts
  for (const x of [2, 24]) {
    img.rect(x, 12, 2, 9, wood);
    img.rect(x, 12, 1, 9, woodMid);
  }
  // white banners hanging at the left
  for (const x of [5, 8, 11]) {
    img.rect(x, 12, 2, 4, '#f4f4f4');
    img.set(x, 14, '#8d99a6');
    img.set(x + 1, 14, '#8d99a6');
  }
  // the red and white awning at the right
  for (let x = 15; x < 23; x++) img.rect(x, 12, 1, 2, Math.floor((x - 15) / 2) % 2 === 0 ? '#d8343c' : '#f4f4f4');
  img.rect(15, 14, 8, 1, '#8f2f2b');
  // a lattice crate under it
  img.rect(15, 15, 8, 4, '#c9a56b');
  for (let i = 0; i < 8; i++) {
    img.set(15 + i, 15 + (i % 4), '#8a6a3a');
    img.set(22 - i, 15 + (i % 4), '#8a6a3a');
  }
  // the counter, with a red book and an orange jar
  img.rect(4, 16, 10, 1, woodLight);
  img.rect(4, 17, 10, 2, woodMid);
  img.rect(4, 17, 10, 1, wood);
  img.rect(6, 15, 2, 1, '#c03030');
  img.rect(10, 14, 2, 2, '#e07b30');
  img.rect(10, 13, 2, 1, '#6b4420');
  // a planter box with plants and red fruit
  img.rect(14, 19, 10, 2, woodMid);
  img.rect(14, 19, 10, 1, woodLight);
  for (const [x, y] of [[16, 18], [19, 17], [22, 18]]) {
    img.ellipse(x, y, 2, 1.6, '#3a9a3a');
    img.set(x - 1, y - 1, '#58b058');
    img.set(x + 1, y, '#d8343c');
  }
  // the wooden floor, and dark round feet under the posts
  img.rect(2, 20, 24, 2, wood);
  for (let x = 3; x < 25; x += 4) img.rect(x, 21, 1, 1, '#3a2616');
  img.rect(2, 20, 24, 1, woodMid);
  for (const x of [2, 24]) img.rect(x, 21, 2, 1, '#2a1c10');
  return img;
}
save('entrance', 'to_shop', woodShop(), 5);

const sign = new Img(12, 16);
sign.rect(5, 9, 2, 7, PALETTE.B);
sign.rect(4, 9, 1, 7, PALETTE.K);
sign.rect(7, 9, 1, 7, PALETTE.K);
sign.rect(0, 0, 12, 10, PALETTE.K);
sign.rect(1, 1, 10, 8, PALETTE.T);
for (const [x, y] of [[2, 3], [3, 2], [4, 3], [5, 4], [6, 3], [7, 2], [8, 3], [9, 4], [2, 6], [3, 5], [4, 6], [5, 7], [6, 6], [7, 5], [8, 6], [9, 7]])
  sign.set(x, y, PALETTE.U);
function lakeSign() {
  const img = new Img(16, 16);
  // water
  img.ellipse(8, 11, 7.6, 4.6, '#2a5aa8');
  img.ellipse(8, 11, 6.6, 3.6, '#3a7bd5');
  img.rect(4, 10, 3, 1, '#7fb2f0');
  img.rect(9, 12, 4, 1, '#7fb2f0');
  img.rect(6, 13, 2, 1, '#2f69bd');
  // reeds with cattail heads
  for (const [x, top] of [[3, 3], [4, 5], [13, 4]]) {
    img.rect(x, top, 1, 8 - (top - 3), '#2c5a2a');
    img.rect(x, top - 1, 1, 2, '#6b4420');
  }
  // a lily pad with a pink flower
  img.ellipse(10, 10, 1.9, 1.1, '#3fa34d');
  img.set(10, 9, PALETTE.N);
  // a short plank pier
  img.rect(0, 12, 5, 2, '#8a5a2b');
  img.rect(0, 12, 5, 1, '#b07a3f');
  img.rect(0, 14, 1, 2, '#6b4420');
  img.rect(4, 14, 1, 2, '#6b4420');
  return img;
}


// --- extra icons -------------------------------------------------------------

const GEAR = [
  '......KKKK......',
  '..KK..KWWK..KK..',
  '.KWWKKKWWKKKWWK.',
  '.KWWWWWWWWWWWWK.',
  '..KWWWLLLLWWWK..',
  '.KKWWLKKKKLWWKK.',
  'KWWWWLK..KLWWWWK',
  'KWWWWLK..KLWWWWK',
  '.KKWWLKKKKLWWKK.',
  '..KWWWLLLLWWWK..',
  '.KWWWWWWWWWWWWK.',
  '.KWWKKKWWKKKWWK.',
  '..KK..KWWK..KK..',
  '......KKKK......',
];
save('ui', 'gear', sprite(GEAR, 16), 2);

// The settings button is a duck's head.
const DUCK_HEAD = [
  '....KKKK....',
  '...KYYYYK...',
  '..KYYYYYYK..',
  '..KYYYKYYK..',
  '..KYYYYYYOOK',
  '..KYYYYYYOOK',
  '..KYYYYYYKK.',
  '...KYYYYK...',
  '....KYYK....',
  '...KKYYKK...',
  '..KWWWWWWK..',
  '..KKKKKKKK..',
];
save('ui', 'settings', sprite(DUCK_HEAD, 12), 2);

const TABLE = [
  '', '', '',
  '...KKKKKKKKKK...',
  '..KTTTTTTTTTTK..',
  '..KTCCCCCCCCTK..',
  '..KKKKKKKKKKKK..',
  '....KBK....KBK..',
  '....KBK....KBK..',
  '....KBK....KBK..',
  '....KBK....KBK..',
  '....KBK....KBK..',
  '....KBK....KBK..',
  '....KKK....KKK..',
];
save('item', 'table', sprite(TABLE), 2);

// The four farm animals (two by day, two by night), 48 x 48.
const HEN = [
  '................',
  '......RR........',
  '.....RRRR.......',
  '....KWWWWK......',
  '....KWKWWOO.....',
  '....KWWWWKR.....',
  '...KWWWWWWK.....',
  '..KWWWWWWWWK....',
  '.KWWWWWWWWWWK...',
  '.KWWWwwwwWWWK...',
  '.KWWwwwwwwWWK...',
  '..KWWwwwwWWK....',
  '...KWWWWWWK.....',
  '....KKKKKK......',
  '.....O..O.......',
  '....OOO.OOO.....',
];
const COW = [
  '.K............K.',
  '.KC..........CK.',
  '..KKKKKKKKKKKK..',
  '.KBBKWWWWWWKBBK.',
  '..KWWBBWWWWWWK..',
  '..KWKWWWWWWKWK..',
  '..KWWWWWWWWWWK..',
  '...KNNNNNNNNK...',
  '...KNKNNNNKNK...',
  '....KKKKKKKK....',
  '..KKWWWWWWWWKK..',
  '.KWBBBWWWWWWBWK.',
  '.KWBBBWWWWBBBWK.',
  '.KWWBWWWWWWBBWK.',
  '.KKKKKKKKKKKKKK.',
  '.KBK.KBK.KBK.KBK',
];
const OWL = [
  '................',
  '....K......K....',
  '....KK....KK....',
  '....KBBBBBBK....',
  '...KBBBBBBBBK...',
  '...KBWWBBWWBK...',
  '...KBWKBBKWBK...',
  '...KBBBOOBBBK...',
  '...KBTTTTTTBK...',
  '...KBTtTTtTBK...',
  '...KBTTTTTTBK...',
  '....KBTttTBK....',
  '....KBBBBBBK....',
  '.....KKKKKK.....',
  '.....OO..OO.....',
  '....OOO..OOO....',
];
const CAT = [
  '..........YY....',
  '.....KKKKKKY....',
  '....KDDDDDDK....',
  '....KRRRRRRK....',
  '..KKKKKKKKKKKK..',
  '...KRRRRRRRRK...',
  '...KOOOOOOOOK...',
  '...KOGKOOKGOK...',
  '...KOOONNOOOK...',
  '....KCCCCCCK....',
  '...KOOCCCCOOK...',
  '..KOOKCCCCKOOK..',
  '..KOOKRRRRKOOK..',
  '...KKKCCCCKKK...',
  '...KDDDK.KDDDK..',
  '...KKKKK.KKKKK..',
];

const CONE_HAT = [
  '.......KK.......',
  '......KOOK......',
  '.....KOWWOK.....',
  '...KOOOOOOOOK...',
];
const GLOVES = [
  '', '', '', '', '', '', '', '', '',
  '.KKKK......KKKK.',
  'KRRRRK....KRRRRK',
  'KRRRRK....KRRRRK',
  '.KKKK......KKKK.',
];
save('outfit', 'cone_hat', sprite(CONE_HAT), 3);
save('outfit', 'gloves', sprite(GLOVES), 3);
save('item', 'cone_hat', sprite(centered(CONE_HAT)), 2);
save('item', 'gloves', sprite(centered(GLOVES)), 2);

const DISCO_BALL = [
  '.......KK.......',
  '.......KK.......',
  '......KKKK......',
  '....KKLWLWKK....',
  '...KLWLSLWLSK...',
  '..KWLSLWLSLWLK..',
  '..KLWLWLSLWLSK..',
  '..KWSLSLWLSLWK..',
  '..KLWLWLSLWLSK..',
  '..KSLWLSLWLSLK..',
  '...KLSLWLSLWK...',
  '....KKLWSWKK....',
  '......KKKK......',
];
save('item', 'disco_ball', sprite(DISCO_BALL), 2);

const CORN = [
  '................',
  '.......GG.......',
  '......GGGG......',
  '.....KYYYYK.....',
  '....KYyYYyYK....',
  '....KYYYYYYK....',
  '....KYyYYyYK....',
  '....KYYYYYYK....',
  '....KYyYYyYK....',
  '.....KYYYYK.....',
  '....GKYyYYKG....',
  '...GGKYYYYKGG...',
  '....GGKKKKGG....',
  '.....GGGGGG.....',
];
save('item', 'corn', sprite(CORN), 2);

const SEED_CAKE = [
  '', '', '', '',
  '.....KKKKKK.....',
  '...KKTTTTTTKK...',
  '..KTTTtTTTTtTK..',
  '.KTTtTTTTTTTTTK.',
  '.KTTTTTtTTTtTTK.',
  '.KTtTTTTTTTTTTK.',
  '.KCCCCCCCCCCCCK.',
  '..KCCCCCCCCCCK..',
  '...KKKKKKKKKK...',
];
save('item', 'seed_cake', sprite(SEED_CAKE), 2);

const HEART = [
  '...KK..KK...',
  '..KRRKKRRK..',
  '.KRWRRRRRRK.',
  '.KRRRRRRRRK.',
  '.KRRRRRRRRK.',
  '..KRRRRRRK..',
  '...KRRRRK...',
  '....KRRK....',
  '.....KK.....',
];
save('ui', 'heart', sprite(HEART, 12), 2);

const FROG = [
  '................',
  '.....KK..KK.....',
  '....KBBKKBBK....',
  '....KBBBBBBK....',
  '....KbbbbbbK....',
  '..KKKKKKKKKKKK..',
  '.KBBBBBBBBBBBBK.',
  '..KKKKKKKKKKKK..',
  '...KGKGGGGKGK...',
  '..KGGGGGGGGGGK..',
  '.KGGgGGGGGGGGGK.',
  '.KGGGGGZZZZGGGK.',
  '.KgGGGGZZZZGGgK.',
  '..KKGGGGGGGGKK..',
  '...KKKKKKKKKK...',
];
save('animal', 'frog', sprite(FROG), 3);

// The dirt path from the house door, winding down to the pier. The waypoints are also written to src/content/farmPath.json,
// so the game can keep decorations off the path.
const FARM_PATH = {
  halfWidth: 22,
  points: [[220, 214], [224, 280], [250, 330], [310, 372], [372, 400], [410, 436], [414, 500], [414, 560]],
  // the branch to the forest: it leaves the main path at (310, 372) and runs to the opening on the right edge
  forestPoints: [[310, 372], [400, 342], [520, 322], [640, 312], [730, 286], [800, 266], [880, 266], [962, 266]],
};
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'farmPath.json'), JSON.stringify(FARM_PATH) + '\n');

function splinePoints(points, perSegment) {
  const out = [];
  const p = [points[0], ...points, points[points.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p[i - 1][0], p[i][0], p[i + 1][0], p[i + 2][0]), f(p[i - 1][1], p[i][1], p[i + 1][1], p[i + 2][1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function farmPathImage() {
  const img = new Img(240, 135);
  const rand = rng(61);
  const samples = [...splinePoints(FARM_PATH.points, 24), ...splinePoints(FARM_PATH.forestPoints, 24)];
  const hw = FARM_PATH.halfWidth;
  for (let py = 0; py < 135; py++) {
    for (let px = 0; px < 240; px++) {
      const x = px * 4 + 2;
      const y = py * 4 + 2;
      let d = Infinity;
      for (const [sx, sy] of samples) d = Math.min(d, Math.hypot(x - sx, y - sy));
      if (d > hw) continue;
      const r = rand();
      let color;
      if (d > hw - 4) color = '#6f5238'; // the dark edge of the path
      else if (d > hw - 9) color = r < 0.5 ? '#8a6a48' : '#7f5f42'; // the worn rim
      else color = r < 0.1 ? '#b8946a' : r < 0.2 ? '#8f6e4c' : r < 0.26 ? '#cfc6b0' : '#9b7653'; // the path, with a few pebbles
      img.set(px, py, color);
    }
  }
  return img;
}
save('ground', 'farm_path', farmPathImage(), 4);

const TREE_SMALL = [
  '................',
  '.....KKKKKK.....',
  '...KKHHHHHHKK...',
  '..KHHHGHHHGHHK..',
  '.KHHGGHHHHGGHHK.',
  '.KHHHHHHGHHHHHK.',
  '.KGHHGHHHHHGHHK.',
  '..KGGHHHHHHGGK..',
  '...KGGGGGGGGK...',
  '....KKKBBKKK....',
  '......KBBK......',
  '......KBbK......',
  '......KBbK......',
  '.....KBBbbK.....',
  '....KKKKKKKK....',
];
const BUSH = [
  '', '',
  '.....KKKKKK.....',
  '...KKHHHHHHKK...',
  '..KHHGHHHGHHHK..',
  '.KHHHHGHHHHGHHK.',
  '.KGHHHHHHGHHHGK.',
  '.KGGHHHHHHHHGGK.',
  '..KGGGGGGGGGGK..',
  '...KKKKKKKKKK...',
];
const FLOWER_WHITE = [
  '............',
  '....KKKK....',
  '...KWWWWK...',
  '...KWYYWK...',
  '...KWWWWK...',
  '....KKKK....',
  '.....GG.....',
  '.....GG.....',
  '....JGG.....',
  '....JGGH....',
  '.....GG.....',
];
const FLOWER_BLUE = FLOWER_WHITE.map((row) => row.replace(/W/g, 'I'));
save('decor', 'tree_small', sprite(TREE_SMALL), 3);
save('decor', 'bush', sprite(BUSH), 3);
save('decor', 'flower_white', sprite(FLOWER_WHITE, 12), 3);
save('decor', 'flower_blue', sprite(FLOWER_BLUE.map((r) => r.replace(/Y/g, 'W')), 12), 3);

// The Reed Warden: a tall heron (drawn facing left like the other beings).
const HERON = [
  '................',
  '......KKKK......',
  '.....KWWWWK.....',
  '.OOOOKWKWWK.....',
  '.......KWWK.....',
  '.......KWWK.....',
  '.......KWWK.....',
  '......KWWWWK....',
  '.....KWWLLWWK...',
  '....KWWLLLLWWK..',
  '....KWWLLLLWWWK.',
  '.....KWWWWWWWK..',
  '......KKKKKKK...',
  '.......O..O.....',
  '.......O..O.....',
  '......OO..OO....',
];
/** The swan that guards the reeds (the pond's boss), drawn after the cream swan in docs/assets example (13.58.20): a plump cream-white swan
 * with a small gold crown, a round head with a cross-shaped eye, a yellow beak, a short thick neck, a big beige bow at the base of the neck,
 * a rounded body with a pointed tail, soft brown outline. 32 x 28, shown at x3. Faces left like the other beings. */
function swan() {
  const W = 32;
  const H = 28;
  const img = new Img(W, H);
  const line = '#7a4a2a';
  const cream = '#fff1e0';
  const shade = '#ecd3b8';
  const shadeDark = '#d9b99b';
  const bow = '#dcc0a2';
  const bowDark = '#b89577';
  const gold = '#f0b030';
  const goldLight = '#ffd34d';
  const beak = '#f5b02a';
  const beakDark = '#e08a1a';
  const disc = (cx, cy, r, color) => {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) img.set(x, y, color);
  };
  // the body: a big plump oval, a little shaded underneath, with a pointed tail on the right
  img.ellipse(20, 19.5, 11.2, 6.6, cream);
  img.ellipse(19, 23.6, 9.4, 2.4, '#f6e6d2');
  for (const [x, y] of [[29, 16], [30, 17], [31, 18], [29, 17], [30, 18], [31, 19], [29, 18], [30, 19], [28, 19], [29, 19]]) img.set(x, y, cream);
  // feather texture on the belly: a light checkered patch
  for (let y = 22; y <= 26; y++) for (let x = 15; x <= 25; x++) if ((x + y) % 2 === 0 && img.data[(y * W + x) * 4 + 3] !== 0) img.set(x, y, '#fffaf2');
  // the neck: a short, thick column standing at the left of the body
  img.ellipse(9, 12.5, 2.9, 5.5, cream);
  img.set(11, 12, shade);
  img.set(11, 14, shade);
  // the head: round and small
  disc(8.6, 6.8, 3.9, cream);
  img.set(5, 9, shade);
  img.set(12, 9, shade);
  // the cross-shaped eye with a little glint
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [0, 0]]) img.set(9 + dx, 6 + dy, '#4a2f1a');
  img.set(10, 5, '#ffffff');
  // the beak, pointing left
  img.rect(4, 7, 3, 1, beak);
  img.rect(2, 8, 5, 1, beak);
  img.rect(2, 9, 5, 1, beakDark);
  img.set(3, 7, goldLight);
  // the little gold crown
  img.rect(6, 2, 6, 2, gold);
  for (const x of [6, 9, 11]) img.rect(x, 0, 1, 2, gold);
  img.set(9, 0, goldLight);
  img.set(9, 1, goldLight);
  img.rect(6, 2, 6, 1, goldLight);
  // the big beige bow at the base of the neck: two loops with a darker rim, a knot, and two tails
  img.ellipse(5, 20, 5, 3.8, bowDark);
  img.ellipse(5, 20, 4.2, 3, bow);
  img.ellipse(14.2, 20.6, 5.2, 4, bowDark);
  img.ellipse(14.2, 20.6, 4.4, 3.2, bow);
  for (const [x, y] of [[3, 19], [4, 19], [5, 18], [6, 19], [13, 20], [14, 19], [15, 20], [16, 19]]) img.set(x, y, shadeDark);
  img.rect(6, 22, 3, 5, bowDark);
  img.rect(7, 22, 1, 4, bow);
  img.rect(11, 23, 3, 4, bowDark);
  img.rect(12, 23, 1, 3, bow);
  img.ellipse(9.6, 20, 2.2, 2.2, bowDark);
  img.ellipse(9.6, 20, 1.3, 1.3, bow);
  // the soft brown outline, around everything that is drawn
  const outline = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (img.data[(y * W + x) * 4 + 3] !== 0) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && img.data[(ny * W + nx) * 4 + 3] !== 0) {
        outline.push([x, y]);
        break;
      }
    }
  }
  for (const [x, y] of outline) img.set(x, y, line);
  return img;
}
save('being', 'reed_guardian', swan(), 3);

save('animal', 'hen', sprite(HEN), 3);
save('animal', 'cow', sprite(COW), 3);
save('animal', 'owl', sprite(OWL), 3);
save('animal', 'cat', sprite(CAT), 3);

// A tiling pattern of little ducks on a soft blue (24 x 24, shown at x3).
const TINY_DUCK = [
  '..KKK...',
  '.KYYYK..',
  '.KYKYKOO',
  '.KYYYYOO',
  '..KYYK..',
  '.KYYYYK.',
  'KYYYYYYK',
  '.KKKKKK.',
];
function blit(dst, src, x0, y0) {
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      if (src.data[i + 3] === 0) continue;
      dst.set(x0 + x, y0 + y, src.data.subarray(i, i + 4));
    }
}
const duckPattern = new Img(24, 24);
duckPattern.rect(0, 0, 24, 24, '#5b8fd0');
const tinyDuck = sprite(TINY_DUCK, 8);
blit(duckPattern, tinyDuck, 2, 2);
blit(duckPattern, tinyDuck, 14, 14);
duckPattern.rect(15, 4, 2, 2, '#78a6e0'); // sparkles
duckPattern.rect(3, 16, 2, 2, '#78a6e0');
save('ui', 'duck_pattern', duckPattern, 3);

// --- backgrounds (240 x 135, scaled x4 to 960 x 540) -------------------------

const BW = 240;
const BH = 135;

const SKY_DAY = ['#6fb4e8', '#7dbdec', '#8cc6ef', '#9dd0f2', '#b0daf5'];
const SKY_NIGHT = ['#080f26', '#0d1736', '#13214a', '#1b2e5c', '#263c6c'];
const CLOUD_DAY = '#ffffff';
const CLOUD_NIGHT = '#3a4a78';

function bands(img, y0, y1, colors) {
  const step = (y1 - y0) / colors.length;
  colors.forEach((c, i) => img.rect(0, Math.round(y0 + i * step), BW, Math.ceil(step) + 1, c));
}

function cloud(img, x, y, color = '#ffffff') {
  img.ellipse(x, y, 7, 2.5, color);
  img.ellipse(x - 3, y - 2, 3.5, 2.5, color);
  img.ellipse(x + 3, y - 3, 4, 3, color);
}

function hills(img, baseY, height, period, phase, color) {
  for (let x = 0; x < BW; x++) {
    const top = baseY - height * (0.5 + 0.5 * Math.sin((x + phase) / period)) - 2 * Math.sin((x + phase) / (period / 3.1));
    img.rect(x, Math.round(top), 1, BH, color);
  }
}

function stars(img, seed, count, maxY, minX = 0, maxX = BW) {
  const rand = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = minX + Math.floor(rand() * (maxX - minX));
    const y = Math.floor(rand() * maxY);
    img.set(x, y, rand() < 0.2 ? '#fff3b0' : '#f4f4f4');
  }
}

function moon(img, x, y, r, skyColor) {
  img.ellipse(x, y, r, r, '#f6e7b0');
  img.ellipse(x - 2, y - 1, r - 1, r - 1, skyColor); // crescent
}

// Farm: the scene covers everything below y = 120 px (row 30) with tiles; the strip above shows.
function makeFarm(night) {
  const img = new Img(BW, BH);
  bands(img, 0, 31, night ? SKY_NIGHT : SKY_DAY);
  if (night) {
    stars(img, 21, 26, 24);
    moon(img, 120, 11, 5, SKY_NIGHT[1]);
  }
  const c = night ? CLOUD_NIGHT : CLOUD_DAY;
  cloud(img, 40, 16, c);
  cloud(img, 205, 17, c);
  if (!night) cloud(img, 118, 13, c);
  hills(img, 30, 7, 23, 0, night ? '#2f5a3a' : '#78b852');
  hills(img, 31, 4, 13, 40, night ? '#25502f' : '#5da130');
  for (let x = 2; x < 150; x += 6) img.rect(x, 26, 1, 5, night ? '#8a8470' : '#e8dcc0'); // fence posts
  img.rect(0, 27, 150, 1, night ? '#8a8470' : '#e8dcc0');
  img.rect(0, 29, 150, 1, night ? '#8a8470' : '#e8dcc0');
  img.rect(0, 31, BW, BH - 31, night ? '#3f7a24' : '#5da130');
  return img;
}
save('background', 'farm', makeFarm(false), 4);
save('background', 'farm_night', makeFarm(true), 4);

// House: the inside of a cardboard box. The wall shows above y = 150 px (row 37); the floor tiles cover the rest.
const HW = { base: '#9a6a3a', rib: '#845a30', light: '#b8844c', edge: '#5a3a1e', tape: '#e8d9a8' }; // wooden walls
function makeHouse(night) {
  const img = new Img(BW, BH);
  const sky = night ? SKY_NIGHT : SKY_DAY;
  img.rect(0, 0, BW, 38, night ? '#a07a46' : HW.base);
  for (let x = 0; x < BW; x += 4) img.rect(x, 0, 1, 34, night ? '#8a6638' : HW.rib); // corrugation
  for (let x = 2; x < BW; x += 8) img.rect(x, 0, 1, 34, night ? '#b48a52' : HW.light);
  img.rect(0, 34, BW, 4, HW.edge); // the fold at the bottom of the wall
  img.rect(0, 34, BW, 1, night ? '#a07a46' : HW.light);
  img.rect(88, 0, 9, 34, HW.tape); // a strip of packing tape down the seam
  for (const y of [6, 15, 23, 30]) img.rect(88, y, 9, 1, '#cdbd8c');
  // a window cut out with scissors
  img.rect(150, 12, 34, 20, HW.edge);
  img.rect(152, 14, 30, 16, sky[2]);
  img.rect(152, 14, 30, 6, sky[0]);
  if (night) {
    stars(img, 33, 9, 12, 153, 181);
    moon(img, 174, 19, 3, sky[1]);
  }
  img.rect(152, 24, 30, 6, night ? '#25502f' : '#78b852');
  img.rect(166, 14, 2, 16, HW.edge);
  img.rect(152, 21, 30, 1, HW.edge);
  // a picture on paper, drawn in marker
  img.rect(204, 12, 18, 15, HW.edge);
  img.rect(205, 13, 16, 13, '#f4f4f4');
  blit(img, tinyDuck, 209, 16);
  img.rect(208, 25, 10, 1, '#3a7bd5');
  img.rect(0, 38, BW, BH - 38, HW.base);
  return img;
}
save('background', 'house', makeHouse(false), 4);

// --- The pond map. One screen: grass and a brick plaza on top, a plank pier running down into teal water,
// lily pads and fish. Drawn after the picture in docs/assets example (pier, brick, scalloped bank, lily pads).
// The land / water / pier layout is a mask (80 x 45 cells of 12 px) that is also written to src/content/pondMask.json,
// so the game knows where the water is: L land, B bricks, P pier, W water.
const WOOD_CAP = '#f4d58d';
const POND_COLS = 80;
const POND_ROWS = 45;

function buildPondMask() {
  const shoreRow = (col) => {
    let r = 15 + Math.round(2.6 * Math.sin(col / 5) + 1.6 * Math.sin(col / 2.1 + 1));
    if (col < 10) r = Math.max(r, 33 - 2 * col); // the left bank runs down, where the farm gate is
    if (col >= 70) r = Math.max(r, 14 + Math.round((col - 70) * 1.5));
    if (col >= 32 && col <= 36) r = Math.max(r, 14); // land at the head of the pier
    return r; // the first water row of this column
  };
  const rows = [];
  for (let row = 0; row < POND_ROWS; row++) {
    let line = '';
    for (let col = 0; col < POND_COLS; col++) {
      let c = row < shoreRow(col) ? 'L' : 'W';
      if (col >= 32 && col <= 36 && row <= 29) c = 'P'; // the pier, running in from the top of the screen
      line += c;
    }
    rows.push(line);
  }
  return rows;
}

// The dense reed bed (pixels) where the Reed Warden stands. It is written to pondMask.json with the layout.
const REED_BED = { x: 760, y: 440, rx: 110, ry: 52 };
const POND_MASK = buildPondMask();
writeFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'pondMask.json'),
  JSON.stringify({ cell: 12, cols: POND_COLS, reedBed: REED_BED, rows: POND_MASK }, null, 0) + '\n',
);

function mixHex(hex, toward, amount) {
  const a = hex.replace('#', '');
  const b = toward.replace('#', '');
  const out = [0, 2, 4].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - amount) + parseInt(b.slice(i, i + 2), 16) * amount));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function makePondMap(night) {
  const img = new Img(BW, BH);
  const rand = rng(night ? 12 : 11);
  const c = (hex) => (night ? mixHex(hex, '#0a1430', 0.52) : hex);
  const at = (x, y) => {
    if (x < 0 || x >= BW) return 'L';
    if (y < 0) return 'L';
    if (y >= BH) return 'W';
    return POND_MASK[Math.floor(y / 3)][Math.floor(x / 3)];
  };
  const land = (ch) => ch !== 'W';

  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < BW; x++) {
      const ch = at(x, y);
      let color;
      if (ch === 'W') {
        const r = rand();
        color = r < 0.05 ? '#7fd6c8' : r < 0.13 ? '#2f8f90' : '#3fa89a';
        // a pale foam line where the water meets the land
        if (land(at(x, y - 1)) || land(at(x - 1, y)) || land(at(x + 1, y))) color = '#9be8d8';
      } else if (ch === 'B') {
        const band = Math.floor(y / 4);
        const mortar = y % 4 === 3 || (x + (band % 2) * 3) % 6 === 5;
        const r = rand();
        color = mortar ? '#7a4228' : r < 0.3 ? '#c47a50' : r < 0.6 ? '#a85f3a' : '#b96b42';
        if (at(x, y + 1) === 'W') color = '#6b3f2a';
      } else if (ch === 'P') {
        const line = y % 4 === 3;
        color = line ? '#8a5a2b' : (Math.floor(y / 4) + Math.floor(x / 12)) % 2 === 0 ? '#c98a3c' : '#b07a3f';
        if (x % 12 === 0) color = '#8a5a2b';
      } else {
        const r = rand();
        color = r < 0.07 ? '#6fb534' : r < 0.12 ? '#a4dc54' : '#8fc83c';
        // the bank: a dark earth edge with a cream lip above it
        if (at(x, y + 1) === 'W' || at(x - 1, y) === 'W' || at(x + 1, y) === 'W') color = '#6b3f2a';
        else if (at(x, y + 2) === 'W') color = '#f4d58d';
      }
      img.set(x, y, c(color));
    }
  }

  // flowers and grass ticks on the land
  for (let i = 0; i < 140; i++) {
    const x = 2 + Math.floor(rand() * (BW - 4));
    const y = 12 + Math.floor(rand() * 90);
    if (at(x, y) !== 'L' || at(x, y + 4) === 'W' || at(x + 2, y) !== 'L') continue;
    if (rand() < 0.4) {
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) img.set(x + dx, y + dy, c('#ffffff'));
      img.set(x, y, c('#f7d038'));
    } else {
      for (const [dx, dy] of [[0, 0], [0, 1], [1, 2], [3, 0], [3, 1], [2, 2]]) img.set(x + dx, y + dy, c('#1e7a3a'));
    }
  }

  // lily pads and a few flowers on the water
  let pads = 0;
  for (let tries = 0; tries < 400 && pads < 14; tries++) {
    const x = 6 + Math.floor(rand() * (BW - 12));
    const y = 20 + Math.floor(rand() * (BH - 26));
    let free = true;
    for (let dy = -3; dy <= 3 && free; dy++) for (let dx = -4; dx <= 4; dx++) if (at(x + dx, y + dy) !== 'W') free = false;
    if (!free) continue;
    pads += 1;
    img.ellipse(x, y, 2.6, 1.5, c('#8ed05a'));
    img.ellipse(x, y, 1.6, 0.7, c('#6bb040'));
    if (pads % 3 === 0) img.set(x + 1, y - 1, c(PALETTE.N));
  }
  // a few reeds (a small stand of rushes) standing in the shallows near the bank
  const awayFromPier = (x) => x < 88 || x > 114;
  let reeds = 0;
  for (let tries = 0; tries < 900 && reeds < 9; tries++) {
    const x = 8 + Math.floor(rand() * (BW - 16));
    const y = 30 + Math.floor(rand() * (BH - 40));
    if (!awayFromPier(x) || at(x, y) !== 'W' || at(x - 3, y) !== 'W' || at(x + 3, y) !== 'W' || !land(at(x, y - 7))) continue;
    reeds += 1;
    for (const [dx, h] of [[-3, 8], [-1, 11], [1, 9], [3, 7]]) {
      const bend = dx < 0 ? -1 : 1;
      for (let i = 0; i < h; i++) img.set(x + dx + (i > h - 3 ? bend : 0), y - i, c(i % 3 === 0 ? '#2f6a2a' : '#5aa83a'));
      if (dx === -1 || dx === 3) img.rect(x + dx + bend - (bend < 0 ? 0 : 0), y - h, 1, 2, c('#6b4420')); // cattail head
    }
    img.rect(x - 5, y + 1, 11, 1, c('#9be8d8')); // ripples around the foot of the reeds
  }
  // the reed bed: a dense stand of reeds in the water where the guardian lives
  for (let i = 0; i < 70; i++) {
    const angle = rand() * Math.PI * 2;
    const spread = Math.sqrt(rand());
    const x = Math.round(REED_BED.x / 4 + Math.cos(angle) * spread * (REED_BED.rx / 4));
    const y = Math.round(REED_BED.y / 4 + Math.sin(angle) * spread * (REED_BED.ry / 4) + 6);
    if (at(x, y) !== 'W' || at(x - 2, y) !== 'W' || at(x + 2, y) !== 'W') continue;
    const h = 9 + Math.floor(rand() * 8);
    const lean = rand() < 0.5 ? -1 : 1;
    for (let k = 0; k < h; k++) img.set(x + (k > h - 4 ? lean : 0), y - k, c(k % 3 === 0 ? '#2f6a2a' : '#5aa83a'));
    if (rand() < 0.4) img.rect(x + lean, y - h, 1, 3, c('#6b4420')); // a cattail head
    if (rand() < 0.35) img.rect(x - 3, y + 1, 7, 1, c('#9be8d8')); // ripples at its foot
  }
  // a little algae drifting on the water
  let algae = 0;
  for (let tries = 0; tries < 400 && algae < 3; tries++) {
    const x = 10 + Math.floor(rand() * (BW - 30));
    const y = 45 + Math.floor(rand() * (BH - 60));
    let free = awayFromPier(x) && awayFromPier(x + 12);
    for (let dy = -2; dy <= 2 && free; dy++) for (let dx = -1; dx <= 13; dx++) if (at(x + dx, y + dy) !== 'W') free = false;
    if (!free) continue;
    algae += 1;
    for (let strand = 0; strand < 3; strand++) {
      for (let i = 0; i < 10; i++) img.set(x + i + strand, y + strand - 1 + Math.round(Math.sin((i + strand * 2) / 2)), c(strand === 1 ? '#3a9a5a' : '#2e7d4f'));
    }
  }
  // a few four-leaf clover leaves floating
  let clover = 0;
  for (let tries = 0; tries < 400 && clover < 3; tries++) {
    const x = 12 + Math.floor(rand() * (BW - 30));
    const y = 40 + Math.floor(rand() * (BH - 55));
    let free = awayFromPier(x) && awayFromPier(x + 6);
    for (let dy = -4; dy <= 4 && free; dy++) for (let dx = -4; dx <= 4; dx++) if (at(x + dx, y + dy) !== 'W') free = false;
    if (!free) continue;
    clover += 1;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) img.rect(x + dx * 1 - (dx < 0 ? 1 : 0), y + dy * 1 - (dy < 0 ? 1 : 0), 2, 2, c('#7ec850'));
    img.set(x, y, c('#4f9a28'));
    img.set(x, y + 2, c('#4f9a28'));
  }
  // dark fish
  let fish = 0;
  for (let tries = 0; tries < 300 && fish < 5; tries++) {
    const x = 8 + Math.floor(rand() * (BW - 20));
    const y = 40 + Math.floor(rand() * (BH - 46));
    let free = true;
    for (let dy = -2; dy <= 2 && free; dy++) for (let dx = -2; dx <= 6; dx++) if (at(x + dx, y + dy) !== 'W') free = false;
    if (!free) continue;
    fish += 1;
    img.rect(x, y, 4, 1, c('#256f86'));
    img.rect(x + 1, y - 1, 2, 1, c('#256f86'));
    img.set(x + 4, y - 1, c('#256f86'));
    img.set(x + 4, y + 1, c('#256f86'));
  }
  // the pier: rails along both sides, and cream-capped posts every so often
  const left = 32 * 3;
  const right = 37 * 3 - 1;
  for (let y = 0; y < 30 * 3; y++) {
    for (const x of [left, left + 1, right - 1, right]) img.set(x, y, c('#6b3f2a'));
  }
  for (let y = 4; y < 30 * 3; y += 12) {
    for (const x of [left - 2, right - 1]) {
      img.rect(x, y, 3, 3, c(WOOD_CAP));
      img.rect(x, y + 3, 3, 1, c('#6b3f2a'));
    }
  }
  img.rect(left, 30 * 3 - 1, right - left + 1, 2, c('#6b3f2a'));
  return img;
}

save('background', 'pond', makePondMap(false), 4);
save('background', 'pond_night', makePondMap(true), 4);

// Battle: a clearing by the water. Fully visible; the two ellipses are where the fighters stand.
function makeBattle(night) {
  const img = new Img(BW, BH);
  if (night) {
    bands(img, 0, 56, ['#080f26', '#0d1736', '#13214a', '#1b2e5c', '#263c6c', '#30497c', '#3b5788']);
    stars(img, 7, 46, 30);
    moon(img, 196, 18, 7, '#0d1736');
  } else {
    bands(img, 0, 56, ['#6fb4e8', '#7dbdec', '#8cc6ef', '#9dd0f2', '#b0daf5', '#c4e4f8', '#d8eefb']);
    cloud(img, 50, 16);
    cloud(img, 150, 12);
    cloud(img, 210, 20);
  }
  hills(img, 56, 9, 17, 5, night ? '#1d2750' : '#6aa86a');
  img.rect(0, 56, BW, 12, night ? '#2a4378' : '#3a7bd5'); // water
  for (let x = 4; x < BW; x += 22) img.rect(x + ((x * 7) % 9), 59 + ((x * 3) % 6), 6, 1, night ? '#4d6fb0' : '#7fb2f0');
  img.rect(0, 68, BW, BH - 68, night ? '#2f6330' : '#4f9a3a');
  const tufts = rng(11);
  for (let i = 0; i < 260; i++) {
    const dark = night ? '#244f26' : '#3f8a2f';
    const light = night ? '#3f7a3a' : '#66b04a';
    img.set(Math.floor(tufts() * BW), 69 + Math.floor(tufts() * 66), tufts() < 0.5 ? dark : light);
  }
  for (const x of [62, 177]) {
    img.ellipse(x, x < 100 ? 86 : 84, 27, 6, night ? '#244f26' : '#3f8a2f');
    img.ellipse(x, x < 100 ? 85 : 83, 25, 5, night ? '#4d8a48' : '#7fc060');
  }
  return img;
}
save('background', 'battle', makeBattle(false), 4);
save('background', 'battle_night', makeBattle(true), 4);

// --- map edge pictures: what lies beyond the screen edge (96 x 540, drawn on a 24 x 135 grid, x4) ---------
// Inspired by the pier-and-lily-pad picture in docs/assets example (teal water, plank pier with cream-capped posts)
// and the cone-hat duck picture next to it.

const EDGE_ROWS = 135;
const EDGE_COLS = 24;
const WATER = { deep: '#2f7f86', mid: '#3a9ca0', light: '#7fd6c8', fish: '#1f5f6a' };
const WOOD = { dark: '#6b3f2a', plank: '#c98a3c', plank2: '#b07a3f', gap: '#8a5a2b', cap: '#f4d58d' };

/** A small white duck with an orange traffic-cone hat, floating (after the cone-hat duck picture). */
const CONE_DUCK = [
  '....O....',
  '...OWO...',
  '..OOOOO..',
  '.OOOOOOO.',
  '.KWWWWWK.',
  'KWWKWOOWK',
  'KWWWWWWWK',
  '.KWWWWWK.',
  '..KKKKK..',
];

/** The pond, seen from the farm: a small cove at the bottom of the screen (960 x 72), a fence on both sides, and the pier. */
function edgePond() {
  const COLS = 240;
  const ROWS = 18;
  const img = new Img(COLS, ROWS);
  const rand = rng(77);
  const pierL = 96; // screen x 384
  const pierR = 110; // screen x 444
  const cx = 104;
  const halfWidth = 50;
  const waterTop = (col) => 5 + Math.round(9 * Math.pow(Math.abs(col - cx) / halfWidth, 3)); // a rounded cove
  const isW = (col, row) => Math.abs(col - cx) <= halfWidth && row >= waterTop(col);
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (isW(col, row)) {
        const r = rand();
        let color = r < 0.05 ? WATER.light : r < 0.13 ? WATER.deep : WATER.mid;
        if (!isW(col, row - 1) || !isW(col - 1, row) || !isW(col + 1, row)) color = '#9be8d8'; // foam
        img.set(col, row, color);
      } else if (isW(col, row + 1) || isW(col - 1, row) || isW(col + 1, row)) {
        img.set(col, row, WOOD.dark); // the bank
      } else if (isW(col, row + 2)) {
        img.set(col, row, WOOD.cap); // the lip of the bank
      }
    }
  }
  // lily pads and a fish
  for (const [x, y, flower] of [[70, 12, true], [86, 14, false], [128, 13, false], [140, 12, true]]) {
    if (!isW(x - 3, y - 2) || !isW(x + 3, y + 2)) continue;
    img.ellipse(x, y, 2.6, 1.4, '#8ed05a');
    img.ellipse(x, y, 1.6, 0.6, '#6bb040');
    if (flower) img.set(x + 1, y - 1, PALETTE.N);
  }
  img.rect(120, 15, 4, 1, WATER.fish);
  img.set(124, 14, WATER.fish);
  img.set(124, 16, WATER.fish);
  // a wooden fence on both sides of the cove, so the duck can only go down the pier
  for (let col = 0; col < COLS; col++) {
    if (col > cx - halfWidth - 3 && col < cx + halfWidth + 3) continue;
    for (const row of [10, 14]) {
      img.set(col, row, WOOD.plank);
      img.set(col, row + 1, WOOD.plank2);
    }
  }
  for (let col = 2; col < COLS; col += 12) {
    if (col > cx - halfWidth - 3 && col < cx + halfWidth + 3) continue;
    img.rect(col, 8, 2, 9, WOOD.plank2);
    img.rect(col, 8, 2, 2, WOOD.cap);
    img.rect(col, 16, 2, 1, WOOD.dark);
  }
  // the pier: planks, side rails and cream-capped posts, running to the bottom of the screen
  for (let x = pierL; x <= pierR; x++) {
    for (let y = 0; y < ROWS; y++) {
      const line = y % 4 === 3;
      img.set(x, y, line ? WOOD.gap : (Math.floor(y / 4) + Math.floor(x / 6)) % 2 === 0 ? WOOD.plank : WOOD.plank2);
    }
  }
  for (let y = 0; y < ROWS; y++) for (const x of [pierL, pierR]) img.set(x, y, WOOD.dark);
  for (let y = 2; y < ROWS; y += 8) {
    for (const x of [pierL - 2, pierR - 1]) {
      img.rect(x, y, 3, 3, WOOD.cap);
      img.rect(x, y + 3, 3, 1, WOOD.dark);
    }
  }
  return img;
}
save('entrance', 'edge_pond', edgePond(), 4);


// =====================================================================================================
// The forest (to the right of the farm), its creatures, the Frog King, the piggy bank and the wagon.
// Inspired by the pictures in docs/assets example: the crowned frog, the squirrel, the pigs, the piggy bank
// and the swamp wagon.
// =====================================================================================================

/** The Frog King, the (easier) boss of the forest. Drawn facing left like the other beings. */
const FROG_KING = [
  '................',
  '..A.A.A.........',
  '..AAAAA.........',
  '.KGGGGGGK.......',
  'KGWKGGKWGK......',
  'KGGGGGGGGGKK....',
  'KGGGGGGGGGGGK...',
  '.KGgGGGGGWWWWK..',
  '.KGGGGGGWWWWWWK.',
  '.KGGgGGGWWWWWWK.',
  '..KGGGGGWWWWWK..',
  '..KKGGGGGWWWWK..',
  '...KGGGGGGGGK...',
  '..KGGKKGGKKGGK..',
  '.KGGGK..KGGGGK..',
  '.KKKK....KKKK...',
];
/** The Frog King, drawn again: a plump green frog facing left, a pale belly, bulging eyes with golden rims and a gold crown (24 x 24, shown at x3). */
function frogKing() {
  const img = new Img(24, 24);
  const line = '#1b1b26';
  const light = '#a8e05a';
  const mid = '#78c43e';
  const dark = '#4a9a30';
  const gold = '#f0b030';
  const goldLight = '#ffe066';
  const goldDark = '#c9801a';
  const blob = (cx, cy, rx, ry, fill) => {
    img.ellipse(cx, cy, rx + 1, ry + 1, line);
    img.ellipse(cx, cy, rx, ry, fill);
  };
  // hind leg and foot (behind the body)
  blob(18, 19, 4.2, 3, dark);
  img.rect(19, 21, 5, 2, line);
  img.rect(19, 21, 4, 1, mid);
  // the body
  blob(13, 15, 9.5, 6.5, mid);
  img.ellipse(13, 12, 7, 3, light); // the lit back
  for (const [x, y] of [[15, 11], [18, 13], [11, 10]]) img.set(x, y, dark); // spots
  // the head, to the left
  blob(8, 13, 6.2, 4.6, mid);
  img.ellipse(8, 11, 4.5, 2, light);
  // the pale belly at the front
  img.ellipse(8, 18, 4.6, 3.2, line);
  img.ellipse(8, 18, 3.8, 2.4, '#f4f4f4');
  img.ellipse(9, 19, 2.6, 1.3, '#d9e4d0');
  // a wide mouth line, and a little blush
  for (let x = 2; x <= 10; x++) img.set(x, 15 + (x < 4 ? 0 : x > 8 ? -1 : 0), line);
  img.set(3, 14, '#e8785e');
  // front leg
  blob(5, 21, 2.8, 1.6, mid);
  // the bulging eyes with golden rims
  for (const [cx, cy] of [[6, 8], [11, 8]]) {
    img.ellipse(cx, cy, 3.6, 3.2, line);
    img.ellipse(cx, cy, 2.8, 2.4, gold);
    img.ellipse(cx, cy, 1.9, 1.7, '#ffffff');
    img.rect(cx - 1, cy, 2, 1, line);
    img.set(cx - 1, cy - 1, '#ffffff');
  }
  // the crown
  img.rect(4, 4, 9, 3, line);
  img.rect(5, 5, 7, 2, gold);
  img.rect(5, 5, 7, 1, goldLight);
  for (const x of [4, 8, 12]) {
    img.rect(x, 1, 2, 4, line);
    img.rect(x, 2, 1, 3, gold);
    img.set(x, 2, goldLight);
    img.set(x + 1, 3, goldDark);
  }
  img.set(8, 6, '#d8343c'); // a ruby
  return img;
}
save('being', 'frog_king', frogKing(), 3);

/** A squirrel with a big curled tail and an acorn. */
const SQUIRREL = [
  '................',
  '..........QQQQ..',
  '........QQRRRRQ.',
  '.......QRRQQQRRQ',
  '..KK...QRQ..QRRQ',
  '.KRRK..QRQ..QRQ.',
  '.KRKRK.QRQ.QRRQ.',
  '.KRRRKKQRQQRRQ..',
  '..KKRRRRRRRRQ...',
  '...KRRRRRRRQ....',
  '...KRRRRRRQ.....',
  '..KBBKRRRKK.....',
  '.KBYBBKKRK......',
  '.KBBBK..KK......',
  '..KKK...........',
];
save('animal', 'squirrel', sprite(SQUIRREL), 3);

/** A pink pig, seen from the side, facing left. */
const PIG = [
  '................',
  '................',
  '.....KK.........',
  '....KNNK..KK....',
  '..KKNNNNKKNNK...',
  '.KNNNNNNNNNNNK..',
  'KnnKNNNNNNNNNNK.',
  'KnKnKNNNNNNNNNNK',
  'KnnnKNNNNNNNNNNK',
  '.KKKNNNNNNNNNNK.',
  '..KNNNNNNNNNNNK.',
  '..KNNNNNNNNNNK..',
  '...KKNNKKNNKK...',
  '....KnnK.KnnK...',
  '....KKKK.KKKK...',
];
save('animal', 'pig', sprite(PIG), 3);

/** The piggy bank with a coin going in (after the piggy-bank picture). */
const PIGGY = [
  '.....KKKK.......',
  '....KYYYYK......',
  '....KYAAYK......',
  '.....KKKK.......',
  '...KKKNNNKKK....',
  '..KNNNNNNNNNK...',
  '.KNNNNNNNNNNNKK.',
  'KNNNNNnnNNNNKnnK',
  'KNNNNNNNNNNKnKnK',
  'KNNNNNNNNNNNnnnK',
  '.KNNNNNNNNNNNNK.',
  '..KNNNNNNNNNNK..',
  '..KKnnKKKKnnKK..',
  '..KKKKK..KKKKK..',
];
save('ui', 'piggy', sprite(PIGGY), 2);

/** A covered wagon (24 x 16 grid), a traveller's wagon that stands in the forest (after the swamp wagon picture). */
const WAGON = [
  '..KKKKKKKKKKKKKKKKKK....',
  '.KBBBBBBBBBBBBBBBBBBK...',
  '.KBTTTTBBTTTTBBTTTTBK...',
  '.KBBBBBBBBBBBBBBBBBBK...',
  '..KKKKKKKKKKKKKKKKKK....',
  '..KbbbbbbbbbbbbbbbbK....',
  '..KbYbbbbbYbbbbbbbbK....',
  '..KbbbbbbbbbbbbbbbbK....',
  '..KbbbbbbbbbbbbbbbbK....',
  '..KKKKKKKKKKKKKKKKKK....',
  '....KKKK......KKKK......',
  '...KDDDDK....KDDDDK.....',
  '..KDDKKDDK..KDDKKDDK....',
  '..KDKBBKDK..KDKBBKDK....',
  '...KDDDDK....KDDDDK.....',
  '....KKKK......KKKK......',
];
save('decor', 'forest_wagon', sprite(WAGON, 24), 4);

// ---- the forest map ----
// The numbers below are also written to src/content/forestMap.json, so the game knows where the gap, the boss and the trail are.
const FOREST = {
  band: { minY: 110, maxY: 470 }, // the walkable strip; trees fill the rest
  gap: { minY: 200, maxY: 330 }, // where the forest opens to the farm (left edge here, right edge of the farm)
  boss: { x: 700, y: 300 }, // the Frog King's stump
  wagon: { x: 200, y: 196 },
  trail: { halfWidth: 22, points: [[0, 266], [140, 268], [260, 292], [380, 322], [520, 332], [640, 318], [690, 304]] },
};
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'forestMap.json'), JSON.stringify(FOREST) + '\n');

function drawTree(img, cx, cy, r, c) {
  img.rect(cx - 1, cy + r - 4, 3, 9, c('#6b4420'));
  img.ellipse(cx, cy, r, r * 0.85, c('#2a6a30'));
  img.ellipse(cx - 1, cy - 2, r * 0.78, r * 0.66, c('#3a8a40'));
  img.ellipse(cx - 3, cy - 4, r * 0.42, r * 0.34, c('#58b058'));
  img.set(cx + Math.round(r * 0.4), cy + 2, c('#1f5628'));
}

function makeForest(night) {
  const img = new Img(240, 135);
  const rand = rng(night ? 72 : 71);
  const c = (hex) => (night ? mixHex(hex, '#0a1430', 0.5) : hex);
  // the ground: dark forest green with leaf litter
  for (let y = 0; y < 135; y++) {
    for (let x = 0; x < 240; x++) {
      const r = rand();
      img.set(x, y, c(r < 0.08 ? '#5aa044' : r < 0.16 ? '#3f7c30' : r < 0.2 ? '#7a5c34' : '#4e8f3a'));
    }
  }
  // the clearing around the Frog King's stump: lighter grass
  const bx = FOREST.boss.x / 4;
  const by = FOREST.boss.y / 4;
  for (let y = 0; y < 135; y++) {
    for (let x = 0; x < 240; x++) {
      if (Math.hypot((x - bx) / 38, (y - by) / 22) < 1 && rand() < 0.8) img.set(x, y, c(rand() < 0.2 ? '#8fc83c' : '#6fb04a'));
    }
  }
  // the dirt trail from the gap at the left edge to the clearing
  const samples = splinePoints(FOREST.trail.points, 24);
  for (let py = 0; py < 135; py++) {
    for (let px = 0; px < 240; px++) {
      const x = px * 4 + 2;
      const y = py * 4 + 2;
      let d = Infinity;
      for (const [sx, sy] of samples) d = Math.min(d, Math.hypot(x - sx, y - sy));
      if (d > FOREST.trail.halfWidth) continue;
      const r = rand();
      img.set(px, py, c(d > FOREST.trail.halfWidth - 4 ? '#6f5238' : r < 0.1 ? '#b8946a' : r < 0.2 ? '#8f6e4c' : r < 0.25 ? '#cfc6b0' : '#9b7653'));
    }
  }
  // sprouts, daisies, mushrooms and moss patches on the forest floor
  for (let i = 0; i < 120; i++) {
    const x = 4 + Math.floor(rand() * 232);
    const y = 30 + Math.floor(rand() * 78);
    const kind = rand();
    if (kind < 0.5) {
      for (const [dx, dy] of [[0, 0], [0, 1], [1, 2], [3, 0], [3, 1], [2, 2]]) img.set(x + dx, y + dy, c('#1e7a3a'));
    } else if (kind < 0.7) {
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) img.set(x + dx, y + dy, c('#ffffff'));
      img.set(x, y, c('#f7d038'));
    } else if (kind < 0.85) {
      img.rect(x - 1, y - 1, 4, 2, c('#d8343c')); // a red mushroom cap
      img.set(x, y - 1, c('#ffffff'));
      img.rect(x + 1, y + 1, 1, 2, c('#f2deb0'));
    } else {
      img.ellipse(x, y, 4, 2, c('#3f9a44'));
    }
  }
  // the Frog King's mossy stump
  img.ellipse(bx, by + 4, 11, 6, c('#5a3a1e'));
  img.ellipse(bx, by + 2, 11, 5, c('#8a5a2b'));
  img.ellipse(bx, by + 1, 9, 3.5, c('#6fb04a'));
  img.ellipse(bx - 3, by, 3, 1.4, c('#8fd04a'));
  // a fallen log near the trail
  img.rect(110, 92, 26, 5, c('#6b4420'));
  img.rect(111, 92, 24, 1, c('#8a5a2b'));
  img.ellipse(110, 94.5, 2, 2.6, c('#c49a5c'));
  // the trees: crowns along the top and the bottom, and along the edges except at the gap
  for (let x = -4; x < 250; x += 17) {
    drawTree(img, x + Math.floor(rand() * 5), 8 + Math.floor(rand() * 6), 13, c);
    drawTree(img, x + 8 + Math.floor(rand() * 5), 22 + Math.floor(rand() * 5), 12, c);
    drawTree(img, x + 4 + Math.floor(rand() * 5), 122 + Math.floor(rand() * 5), 13, c);
    drawTree(img, x + 12 + Math.floor(rand() * 5), 112 + Math.floor(rand() * 4), 11, c);
  }
  for (let y = 36; y < 108; y += 15) {
    const inGap = y * 4 > FOREST.gap.minY - 20 && y * 4 < FOREST.gap.maxY + 20;
    if (!inGap) drawTree(img, 3 + Math.floor(rand() * 4), y, 11, c);
    drawTree(img, 236 + Math.floor(rand() * 3), y + 6, 11, c);
  }
  return img;
}
save('background', 'forest', makeForest(false), 4);
save('background', 'forest_night', makeForest(true), 4);

/** The strip at the right edge of the farm (160 x 540): a wall of trees with an opening where the trail goes into the forest. */
function edgeForest() {
  const COLS = 40;
  const img = new Img(COLS, 135);
  const rand = rng(88);
  const c = (hex) => hex;
  const gapTop = FOREST.gap.minY / 4;
  const gapBottom = FOREST.gap.maxY / 4;
  // Rows of trees, staggered so the left edge of the wall is ragged, not a straight line. Every crown stays inside the strip.
  for (let row = 0, y = 8; y < 135 + 10; row++, y += 12) {
    const nearGap = y > gapTop - 11 && y < gapBottom + 11;
    if (nearGap) continue;
    const jitter = Math.floor(rand() * 4);
    drawTree(img, 15 + jitter + (row % 2) * 3, y, 12, c); // front row, at the left of the wall
    drawTree(img, 31 + (row % 2) * 2 - Math.floor(rand() * 3), y + 6, 11, c); // back row, at the right
  }
  // bushes and flowers at the foot of the wall, so it blends into the grass
  for (let i = 0; i < 26; i++) {
    const y = 8 + Math.floor(rand() * 124);
    if (y > gapTop - 3 && y < gapBottom + 3) continue;
    const x = 5 + Math.floor(rand() * 8);
    if (rand() < 0.5) img.ellipse(x, y, 3, 2, '#3a8a40');
    else for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) img.set(x + dx, y + dy, '#ffffff');
  }
  // The opening is left empty: the path of the farm itself runs through it (it is drawn under this strip).
  return img;
}
save('entrance', 'edge_forest', edgeForest(), 4);

console.log(`Wrote ${written} PNG files to ${OUT}`);
