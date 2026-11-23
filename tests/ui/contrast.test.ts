import { describe, expect, it } from 'vitest';
import { config } from '../../src/config';

/** WCAG 2.1 relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const channel = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const c = config.colors;

describe('WCAG 2.1 AA colors (text needs 4.5:1)', () => {
  // [text color, background it is drawn on]
  const pairs: Array<[string, string, string]> = [
    ['text on panel', c.text, c.panel],
    ['muted text on panel', c.textMuted, c.panel],
    ['text on row', c.text, c.row],
    ['muted text on row', c.textMuted, c.row],
    ['accent on row', c.accent, c.row],
    ['good on row', c.good, c.row],
    ['text on selected row', c.text, c.rowSelected],
    ['muted text on selected row', c.textMuted, c.rowSelected],
    ['accent on selected row', c.accent, c.rowSelected],
    ['good on selected row', c.good, c.rowSelected],
    ['accent on panel', c.accent, c.panel],
    ['good on panel', c.good, c.panel],
    ['button text', c.text, c.button],
    ['button text, hovered', c.text, c.buttonHover],
    ['button text, selected', c.text, c.buttonSelected],
  ];

  for (const [name, fg, bg] of pairs) {
    it(`${name}: ${fg} on ${bg}`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('the focus frame and button borders stand out on black buttons and dark panels (3:1)', () => {
    expect(contrast(c.focus, c.button)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.focus, c.panel)).toBeGreaterThanOrEqual(3);
  });

  it('the selected row frame stands out from the unselected row by 3:1 (non-text contrast)', () => {
    expect(contrast(c.accent, c.row)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.accent, c.rowSelected)).toBeGreaterThanOrEqual(3);
  });
});

describe('Barn shop colors (WCAG 2.1 AA, text needs 4.5:1)', () => {
  const s = config.shopColors;
  const pairs: Array<[string, string, string]> = [
    ['text on panel', s.text, s.panel],
    ['muted on panel', s.muted, s.panel],
    ['accent on panel', s.accent, s.panel],
    ['text on row', s.text, s.row],
    ['muted on row', s.muted, s.row],
    ['accent on row', s.accent, s.row],
    ['good on row', s.good, s.row],
    ['text on selected row', s.text, s.rowSelected],
    ['muted on selected row', s.muted, s.rowSelected],
    ['accent on selected row', s.accent, s.rowSelected],
    ['good on selected row', s.good, s.rowSelected],
  ];
  for (const [name, fg, bg] of pairs) {
    it(`${name}: ${fg} on ${bg}`, () => {
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
