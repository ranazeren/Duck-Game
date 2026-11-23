/** Collects the lines of a battle and calls back so Battle can emit `log-added`. */
export class BattleLog {
  private readonly lines: string[] = [];
  private readonly onAdd: ((line: string) => void) | null;

  constructor(onAdd: ((line: string) => void) | null = null) {
    this.onAdd = onAdd;
  }

  add(line: string): void {
    this.lines.push(line);
    this.onAdd?.(line);
  }

  getLines(): readonly string[] {
    return this.lines;
  }
}
