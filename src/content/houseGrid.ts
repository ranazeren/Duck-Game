import { config } from '../config';

/** The house floor is a grid; every cell is one slot of GameState.placed, with the id "c<col>r<row>". */
export const GRID = config.houseGrid;

export function cellId(col: number, row: number): string {
  return `c${col}r${row}`;
}

export function parseCell(id: string): { col: number; row: number } | null {
  const match = /^c(\d+)r(\d+)$/.exec(id);
  if (!match) return null;
  const col = Number(match[1]);
  const row = Number(match[2]);
  return col < GRID.cols && row < GRID.rows ? { col, row } : null;
}

/** The middle of a cell, in screen pixels. */
export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: GRID.originX + (col + 0.5) * GRID.cell, y: GRID.originY + (row + 0.5) * GRID.cell };
}

/** The cells in front of the exit stay free. */
export const EXIT_COL = Math.floor(GRID.cols / 2);
export const BLOCKED = new Set([cellId(EXIT_COL, GRID.rows - 1), cellId(EXIT_COL, GRID.rows - 2)]);
