import type { BeingId } from '../config';

/** One line as it is shown: who says it, and what. */
export interface SpokenLine {
  speaker: string;
  text: string;
}

/** Shows a conversation and calls `onDone` when the player has read it. */
export type Talk = (lines: SpokenLine[], onDone: () => void) => void;

interface ScriptLine {
  by: 'duck' | 'being';
  text: string;
}

interface BeingScript {
  /** Said when befriending goes wrong and the being picks a fight instead. */
  angry: string;
  /** Friendly beings speak kindly when befriended; the others treat the duck as an enemy even then. */
  friendly: boolean;
  befriend: ScriptLine[];
  fight: ScriptLine[];
}

const DUCK_NAME = 'Duck';

/** Plain content table: what each being and the duck say. Edit the lines freely. */
export const DIALOGUE: Record<BeingId, BeingScript> = {
  wild_duck: {
    friendly: true,
    angry: 'Friends? FRIENDS?! You stepped on my favorite lily pad!',
    befriend: [
      { by: 'being', text: 'Oh! A new face. Your feathers shine like morning water.' },
      { by: 'duck', text: "You're not so bad yourself." },
      { by: 'being', text: 'You are the nicest duck on this whole pond. Here, I saved this for you.' },
    ],
    fight: [
      { by: 'duck', text: 'This pond is too small for two ducks.' },
      { by: 'being', text: 'Quack?! I was only paddling!' },
      { by: 'duck', text: 'Then paddle faster.' },
    ],
  },
  trash_mob: {
    friendly: false,
    angry: 'Friends? I know that smile. You want my bag. Not today!',
    befriend: [
      { by: 'duck', text: 'Hey. Friends?' },
      { by: 'being', text: 'Friends? You ducks eat all the bread and leave me the bag.' },
      { by: 'being', text: '...Fine. Take this and stop staring at my lid.' },
    ],
    fight: [
      { by: 'being', text: 'You looking at my trash, bird?' },
      { by: 'duck', text: "I've seen cleaner puddles. Keep your lid on." },
      { by: 'being', text: "That's it. The lid comes off!" },
    ],
  },
  ghost: {
    friendly: true,
    angry: 'Everyone says they want to be friends, and then they walk through me. Not this time!',
    befriend: [
      { by: 'being', text: 'Boo... oh, sorry. Did I scare you? I never mean to.' },
      { by: 'duck', text: "Not even a little. You're kind of sweet." },
      { by: 'being', text: 'Nobody ever stays to talk. You have a warm heart. Please, keep this.' },
    ],
    fight: [
      { by: 'duck', text: 'Boo yourself, bedsheet.' },
      { by: 'being', text: 'How rude... I only wanted company.' },
      { by: 'duck', text: 'Go haunt somebody your own size.' },
    ],
  },
  frog_king: {
    friendly: false,
    angry: 'A king does not befriend ducks. A king flattens them!',
    befriend: [
      { by: 'duck', text: 'Your Majesty, may we be friends?' },
      { by: 'being', text: 'Friends? I have a whole court of flies for that.' },
      { by: 'being', text: 'Begone, feathered peasant.' },
    ],
    fight: [
      { by: 'being', text: 'Ribbit! Who dares walk into the court of the Frog King?' },
      { by: 'duck', text: 'A duck. Your throne is a stump, by the way.' },
      { by: 'being', text: 'A STUMP?! Guards! ...I have no guards. Fine. Prepare yourself!' },
    ],
  },
  reed_guardian: {
    friendly: false,
    angry: 'Nobody takes a single reed from my bed!',
    befriend: [
      { by: 'duck', text: 'Hello. Can we talk?' },
      { by: 'being', text: 'I talk to nobody who walks through my reeds.' },
      { by: 'being', text: '...Leave. Now.' },
    ],
    fight: [
      { by: 'being', text: 'These reeds have stood for a hundred summers. Turn back, little duck.' },
      { by: 'duck', text: 'I only want a look at what you are guarding.' },
      { by: 'being', text: 'Then you will have to get past my beak!' },
    ],
  },
  robot_duck: {
    friendly: false,
    angry: 'FRIENDSHIP PROTOCOL NOT FOUND. SWITCHING TO COMBAT PROTOCOL.',
    befriend: [
      { by: 'being', text: 'SCANNING. ORGANIC DUCK DETECTED. THREAT LEVEL: ANNOYING.' },
      { by: 'duck', text: 'I come in peace, toaster.' },
      { by: 'being', text: 'PEACE ACCEPTED UNDER PROTEST. TAKE ITEM. DO NOT TOUCH MY BOLTS.' },
    ],
    fight: [
      { by: 'being', text: 'TARGET ACQUIRED. PREPARE FOR DE-FEATHERING.' },
      { by: 'duck', text: 'Big talk for a kettle with a beak.' },
      { by: 'being', text: 'INSULT LOGGED. COMBAT MODE: ON.' },
    ],
  },
};

/** The line a being says when befriending goes wrong. A fight conversation follows it. */
export function angryLine(beingId: BeingId, beingName: string): SpokenLine {
  return { speaker: beingName, text: DIALOGUE[beingId].angry };
}

/** The conversation for meeting a being, with the speakers' names filled in. */
export function dialogueFor(beingId: BeingId, beingName: string, kind: 'befriend' | 'fight'): SpokenLine[] {
  return DIALOGUE[beingId][kind].map((line) => ({
    speaker: line.by === 'duck' ? DUCK_NAME : beingName,
    text: line.text,
  }));
}
