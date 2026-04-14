import type { Method } from './utils';
import type { Context } from './types';

export interface Adapter<App, R> {
  readonly name: string;

  register(
    app: App,
    method: Method,
    pathname: string,
    proxy: (raw: R) => Promise<unknown>
  ): void;

  transform(raw: R, pathname: string, method: Method): Context<R>;
}
