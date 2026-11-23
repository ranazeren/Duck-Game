import Phaser from 'phaser';
import { Audio } from '../assets/Audio';
import { config } from '../config';
import type { SpokenLine } from '../content/dialogue';

export interface DialogueHooks {
  onOpen(): void;
  onClose(): void;
}

const WIDTH = 780;
const LINE_HEIGHT = 124;
const CHOICE_HEIGHT = 36;
const COLORS = config.colors;

/**
 * Plain UI class (not a pattern): shows a conversation one line at a time.
 * Space, Enter or a click moves on. A conversation may end with choices: Up / Down (or W / S) move
 * the highlight, Enter, Space or a click picks, and the number keys pick directly.
 */
export class DialogueBox {
  private readonly hooks: DialogueHooks;
  private readonly scene: Phaser.Scene;
  private readonly box: Phaser.GameObjects.Container;
  private readonly speaker: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private choiceObjects: Phaser.GameObjects.GameObject[] = [];
  private lines: SpokenLine[] = [];
  private index = 0;
  private choices: string[] = [];
  private choosing = false;
  private highlight = 0;
  private onDone: ((choice: number) => void) | null = null;

  constructor(scene: Phaser.Scene, hooks: DialogueHooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.backdrop = scene.add.rectangle(0, 0, WIDTH, LINE_HEIGHT, 0x10131c, 0.96).setOrigin(0).setStrokeStyle(3, 0xffffff, 0.9);
    this.backdrop.setInteractive({ useHandCursor: true });
    this.backdrop.on('pointerdown', () => this.advance());
    this.speaker = scene.add.text(22, 14, '', { fontFamily: config.fontFamily, fontSize: '17px', fontStyle: 'bold', color: COLORS.accent });
    this.body = scene.add.text(22, 44, '', { fontFamily: config.fontFamily, fontSize: '18px', color: COLORS.text, wordWrap: { width: WIDTH - 44 }, lineSpacing: 4 });
    this.hint = scene.add.text(WIDTH - 16, LINE_HEIGHT - 10, 'Space  ▶', { fontFamily: config.fontFamily, fontSize: '14px', color: COLORS.textMuted }).setOrigin(1, 1);
    this.box = scene.add.container(0, 0, [this.backdrop, this.speaker, this.body, this.hint]).setDepth(80).setVisible(false);
    this.place(LINE_HEIGHT);

    const keyboard = scene.input.keyboard;
    keyboard?.on('keydown-SPACE', () => this.confirm());
    keyboard?.on('keydown-ENTER', () => this.confirm());
    keyboard?.on('keydown-UP', () => this.moveHighlight(-1));
    keyboard?.on('keydown-W', () => this.moveHighlight(-1));
    keyboard?.on('keydown-DOWN', () => this.moveHighlight(1));
    keyboard?.on('keydown-S', () => this.moveHighlight(1));
    keyboard?.on('keydown', (event: KeyboardEvent) => {
      const number = Number(event.key);
      if (this.choosing && number >= 1 && number <= this.choices.length) this.pick(number - 1);
    });
  }

  isOpen(): boolean {
    return this.box.visible;
  }

  /** Shows the lines; `onDone` gets the index of the chosen option, or 0 when there were no choices. */
  show(lines: SpokenLine[], onDone: (choice: number) => void, choices: string[] = []): void {
    if (this.isOpen() || lines.length === 0) {
      onDone(0);
      return;
    }
    this.lines = lines;
    this.index = 0;
    this.choices = choices;
    this.choosing = false;
    this.onDone = onDone;
    this.box.setVisible(true);
    this.hooks.onOpen();
    this.render();
  }

  /** Click or Space on a line: the next line, then the choices (if any), then the end. */
  advance(): void {
    if (!this.isOpen() || this.choosing) return;
    Audio.play('sfx', 'click');
    this.index += 1;
    if (this.index < this.lines.length) {
      this.render();
    } else if (this.choices.length > 0) {
      this.showChoices();
    } else {
      this.finish(0);
    }
  }

  private confirm(): void {
    if (this.choosing) this.pick(this.highlight);
    else this.advance();
  }

  private render(): void {
    const line = this.lines[this.index];
    this.speaker.setText(line.speaker);
    this.body.setText(line.text);
    this.hint.setVisible(true);
    this.clearChoices();
    this.backdrop.setSize(WIDTH, LINE_HEIGHT);
    this.place(LINE_HEIGHT);
  }

  private showChoices(): void {
    this.choosing = true;
    this.highlight = 0;
    this.hint.setVisible(false);
    this.drawChoices();
  }

  private drawChoices(): void {
    this.clearChoices();
    const height = LINE_HEIGHT + 14 + this.choices.length * CHOICE_HEIGHT;
    this.backdrop.setSize(WIDTH, height);
    this.place(height);
    this.choices.forEach((text, i) => {
      const y = LINE_HEIGHT - 6 + i * CHOICE_HEIGHT;
      const selected = i === this.highlight;
      // The highlighted choice is marked by a bar, a frame and an arrow, never by color alone.
      const row = this.scene.add
        .rectangle(18, y, WIDTH - 36, CHOICE_HEIGHT - 4, selected ? 0x2d4a7a : 0x1b2030, 1)
        .setOrigin(0)
        .setStrokeStyle(selected ? 3 : 1, selected ? 0xffe066 : 0x6b7690, 1);
      row.setInteractive({ useHandCursor: true });
      row.on('pointerover', () => {
        this.highlight = i;
        this.drawChoices();
      });
      row.on('pointerdown', () => this.pick(i));
      const label = this.scene.add.text(32, y + 6, `${selected ? '▶' : ' '}  ${i + 1}.  ${text}`, {
        fontFamily: config.fontFamily,
        fontSize: '16px',
        color: COLORS.text,
      });
      this.box.add([row, label]);
      this.choiceObjects.push(row, label);
    });
  }

  private clearChoices(): void {
    for (const object of this.choiceObjects) object.destroy();
    this.choiceObjects = [];
  }

  private moveHighlight(step: number): void {
    if (!this.choosing) return;
    this.highlight = (this.highlight + step + this.choices.length) % this.choices.length;
    Audio.play('sfx', 'click');
    this.drawChoices();
  }

  private pick(index: number): void {
    if (!this.choosing) return;
    Audio.play('sfx', 'click');
    this.finish(index);
  }

  private finish(choice: number): void {
    const done = this.onDone;
    this.onDone = null;
    this.choosing = false;
    this.clearChoices();
    this.box.setVisible(false);
    this.hooks.onClose();
    done?.(choice);
  }

  /** The box sits at the bottom of the screen and grows upward. */
  private place(height: number): void {
    this.box.setPosition((config.gameWidth - WIDTH) / 2, config.gameHeight - height - 16);
  }
}
