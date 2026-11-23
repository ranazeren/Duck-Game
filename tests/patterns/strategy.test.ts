import { describe, expect, it } from 'vitest';
import { BattleLog } from '../../src/battle/BattleLog';
import { createRng } from '../../src/core/Rng';
import type { BattleCommand } from '../../src/patterns/command/BattleCommand';
import { Duck } from '../../src/patterns/decorator/Duck';
import { RapperOutfit } from '../../src/patterns/decorator/RapperOutfit';
import { WildDuck } from '../../src/patterns/factory/WildDuck';
import { BossAI } from '../../src/patterns/strategy/BossAI';
import type { Move } from '../../src/patterns/strategy/Move';
import { Peck } from '../../src/patterns/strategy/Peck';
import { Quack } from '../../src/patterns/strategy/Quack';
import { RandomAI } from '../../src/patterns/strategy/RandomAI';

/** Runs the command and reports which move it used, by the line it logged. */
function usedMove(cmd: BattleCommand): string {
  const log = new BattleLog();
  cmd.execute(log);
  return log.getLines()[0].includes('quacks') ? 'Quack' : 'Peck';
}

describe('Move strategies', () => {
  it('Peck deals the full attack', () => {
    const target = new Duck();
    new Peck().apply(new Duck(20, 3), target, new BattleLog());
    expect(target.getHp()).toBe(17);
  });

  it('Quack deals ceil(attack * quackFactor), at least 1', () => {
    const target = new Duck();
    new Quack().apply(new Duck(20, 3), target, new BattleLog());
    expect(target.getHp()).toBe(18);
    new Quack().apply(new Duck(20, 0), target, new BattleLog());
    expect(target.getHp()).toBe(17);
  });

  it('damage flows through getAttack, so outfit bonuses count (Nest 4)', () => {
    const target = new Duck();
    new Peck().apply(new RapperOutfit(new Duck()), target, new BattleLog());
    expect(target.getHp()).toBe(20 - 6);
  });
});

describe('EnemyAI strategies return commands (Nest 6)', () => {
  it('RandomAI picks from the being\'s moves using the injected rng', () => {
    const being = new WildDuck();
    const player = new Duck();
    const picks = new Set<string>();
    const ai = new RandomAI(createRng(3));
    for (let i = 0; i < 40; i++) {
      const cmd = ai.chooseCommand(being, player);
      expect(cmd.actor).toBe(being);
      expect(cmd.priority).toBe(0);
      picks.add(usedMove(cmd));
    }
    expect([...picks].sort()).toEqual(['Peck', 'Quack']);
  });

  it('BossAI cycles the moves in order and uses the last move every third turn', () => {
    const being = new WildDuck();
    const special: Move = {
      name: 'Special',
      staminaCost: 0,
      apply: (_user, _target, log) => log.add('special quacks'),
    };
    being.moves = [new Peck(), new Peck(), special];
    const ai = new BossAI();
    const player = new Duck(1000);
    const used: string[] = [];
    for (let i = 0; i < 6; i++) used.push(usedMove(ai.chooseCommand(being, player)));
    // turns 1,2 cycle (Peck, Peck); turn 3 is the last move; turns 4,5 continue the cycle (Special, Peck); turn 6 last move
    expect(used).toEqual(['Peck', 'Peck', 'Quack', 'Quack', 'Peck', 'Quack']);
  });
});
