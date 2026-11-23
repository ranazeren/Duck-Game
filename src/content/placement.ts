/**
 * A placed item is stored in GameState.placed as a plain string: the item id, plus "@<quarter turns>"
 * when it is turned (for example "chair" or "chair@1"). Rotation is clockwise, in steps of 90 degrees.
 * This keeps the house commands and the save file unchanged: they only move strings.
 */
export interface Placed {
  id: string;
  /** Clockwise quarter turns, 0 to 3. */
  rot: number;
}

export function joinPlaced(id: string, rot: number): string {
  const turns = ((rot % 4) + 4) % 4;
  return turns === 0 ? id : `${id}@${turns}`;
}

export function splitPlaced(value: string): Placed {
  const [id, turns] = value.split('@');
  const rot = turns === undefined ? 0 : ((Number(turns) % 4) + 4) % 4;
  return { id, rot: Number.isFinite(rot) ? rot : 0 };
}
