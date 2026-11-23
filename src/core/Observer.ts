/** Observer (push model): the event name and its data travel in `update`. */
export interface Observer {
  update(event: string, data?: unknown): void;
}
