import type { Phase } from '../core/GameState';
import type { SpokenLine } from './dialogue';

/** One thing the duck can say to a farm animal, and how the animal answers. */
export interface AnimalOption {
  text: string;
  /** A kind answer. The animal gives its furniture for it (once). */
  kind: boolean;
  reply: string[];
}

export interface FarmAnimal {
  /** Also the asset id: `animal/<id>`. */
  id: string;
  name: string;
  phase: Phase;
  /** Where it stands on the farm. */
  x: number;
  y: number;
  /** The furniture it gives for a kind answer. */
  furniture: string;
  greeting: string[];
  options: AnimalOption[];
  /** Said when it gives the furniture. */
  gift: string[];
  /** Said instead of the gift when the duck already has that furniture. */
  alreadyHave: string[];
}

/** Plain content table: two animals by day and two by night. Edit the lines freely. */
export const FARM_ANIMALS: FarmAnimal[] = [
  {
    id: 'hen',
    name: 'Ginger',
    phase: 'day',
    x: 640,
    y: 250,
    furniture: 'chair',
    greeting: ['Cluck! Oh, a visitor. Mind the corn, dear, I have just counted it.'],
    options: [
      { text: 'Your coop is the tidiest on the farm.', kind: true, reply: ['Tidiest?! Oh, you flatter an old hen. Nobody ever notices the sweeping.'] },
      { text: 'Can I help you count the corn?', kind: true, reply: ['Would you? My eyes are not what they were. You are a dear.'] },
      { text: 'Chickens are just ducks that gave up.', kind: false, reply: ['Gave up?! Out! Go and soak your head in the pond.'] },
    ],
    gift: ['You are the first to be polite all week. Here, take this chair. It is too big for the coop, anyway.'],
    alreadyHave: ['I have nothing left to give you but my thanks. Come back for a chat any time.'],
  },
  {
    id: 'cow',
    name: 'Clarabelle',
    phase: 'day',
    x: 430,
    y: 205,
    furniture: 'table',
    greeting: ['Mooo... Hello, little one. I was just chewing on a very deep thought.'],
    options: [
      { text: 'Tell me the deep thought. I am listening.', kind: true, reply: ['The thought is: grass. It is everywhere. Nobody else finds that moving, but you do.'] },
      { text: 'Your spots look like a map of somewhere lovely.', kind: true, reply: ['A map! Yes! I always said the left side was a continent.'] },
      { text: 'You are very big. And slow.', kind: false, reply: ['Slow is a choice. Rude is also a choice. Hmph.'] },
    ],
    gift: ['A friend who listens! Take this little table. I made it from a fallen fence post. Put your berries on it.'],
    alreadyHave: ['You already have my table. Now sit, and let us think about grass together.'],
  },
  {
    id: 'owl',
    name: 'Hedwig',
    phase: 'night',
    x: 700,
    y: 235,
    furniture: 'lamp',
    greeting: ['Hoo. A duck awake at this hour. Either you are brave or you are lost.'],
    options: [
      { text: 'Brave. And curious about the night.', kind: true, reply: ['Curious! The best quality. Most creatures just bump into the fence.'] },
      { text: 'Lost, honestly. Could you teach me the stars?', kind: true, reply: ['Teach you the stars? I would be delighted. Look up, the bright one is called Gerald.'] },
      { text: 'Owls are just cats with feathers.', kind: false, reply: ['I will pretend I did not hear that. Hoo-rrible manners.'] },
    ],
    gift: ['A student at last. Take this lamp, so you can read by night. It is a bit warm. Do not lick it.'],
    alreadyHave: ['You carry my lamp already. Now, where were we? Ah yes, Gerald the star.'],
  },
  {
    id: 'cat',
    name: 'Puss in Boots',
    phase: 'night',
    x: 400,
    y: 260,
    furniture: 'rug',
    greeting: ['Mrrp. I was not waiting for you. I just happened to sit here, for hours.'],
    options: [
      { text: 'Your fur looks softer than any cloud.', kind: true, reply: ['...Obviously. But it is nice to hear someone say it out loud. Purr.'] },
      { text: 'I will keep you company, if you like.', kind: true, reply: ['Company? I suppose. You may sit near me. Not too near.'] },
      { text: 'Can I chase your tail?', kind: false, reply: ['No. Absolutely not. I am leaving. I am staying exactly here, but in spirit I am leaving.'] },
    ],
    gift: ['You have earned this rug. It is the softest thing I own, and I own a great many soft things.'],
    alreadyHave: ['You already have my rug. Sit. Purr. Say nothing. Perfect.'],
  },
];

export function animalsFor(phase: Phase): FarmAnimal[] {
  return FARM_ANIMALS.filter((animal) => animal.phase === phase);
}

/** The lines as spoken: the animal's name filled in. */
export function spoken(animal: FarmAnimal, lines: string[]): SpokenLine[] {
  return lines.map((text) => ({ speaker: animal.name, text }));
}
