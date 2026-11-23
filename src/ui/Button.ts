import Phaser from 'phaser';
import { Audio } from '../assets/Audio';
import { config } from '../config';

export interface ButtonOptions {
  enabled?: boolean;
  fontSize?: number;
  /** Draw the button as currently chosen. */
  selected?: boolean;
}

// All of these keep white text at 4.5:1 or better (WCAG 2.1 AA); see tests/ui/contrast.test.ts.
const COLOR = config.colors.button;
const COLOR_HOVER = config.colors.buttonHover;
const COLOR_SELECTED = config.colors.buttonSelected;
const COLOR_DISABLED = '#555555'; // disabled controls are exempt from the contrast rule

/** Plain helper (not a pattern): a clickable text label used by every menu. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: ButtonOptions = {},
): Phaser.GameObjects.Text {
  const enabled = options.enabled ?? true;
  const base = options.selected ? COLOR_SELECTED : COLOR;
  const button = scene.add.text(x, y, label, {
    fontFamily: config.fontFamily,
    fontSize: `${options.fontSize ?? 14}px`,
    fontStyle: 'bold',
    color: config.colors.text,
    backgroundColor: enabled ? base : COLOR_DISABLED,
    padding: { x: 10, y: 5 },
  });
  if (!enabled) {
    button.setAlpha(0.55);
    return button;
  }
  button.setInteractive({ useHandCursor: true });
  button.on('pointerover', () => button.setBackgroundColor(COLOR_HOVER));
  button.on('pointerout', () => button.setBackgroundColor(base));
  button.on('pointerdown', () => {
    Audio.play('sfx', 'click');
    onClick();
  });
  return button;
}
