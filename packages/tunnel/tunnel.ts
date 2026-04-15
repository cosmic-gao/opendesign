import { hash, type Method, type Endpoint } from './utils';
import type { Handler } from './types';
import type { Adapter } from './adapter';

export interface Tunnel<App, R> {
  register<const Routes extends Record<string, Handler<R>>>(routes: Routes): void;
  unregister(key: string): void;
}

export class Tunnel<App, R> {
  private readonly registry = new Map<number, Handler<R>>();

  public constructor(
    private readonly app: App,
    private readonly adapter: Adapter<App, R>
  ) {}

  public register<const Routes extends Record<string, Handler<R>>>(routes: Routes): void {
    for (const [key, handler] of Object.entries(routes)) {
      const [method, pathname] = this.parse(key);
      const endpoint = `${method} ${pathname}` as Endpoint;
      const routeId = hash(endpoint);

      const isLinked = this.registry.has(routeId);

      this.registry.set(routeId, handler);

      if (!isLinked) {
        this.adapter.register(
          this.app,
          method,
          pathname,
          this.proxy(routeId, method, pathname)
        );
      }
    }
  }

  public unregister(key: string): void {
    const [method, pathname] = this.parse(key);
    const endpoint = `${method} ${pathname}` as Endpoint;
    const routeId = hash(endpoint);
    this.registry.delete(routeId);
  }

  private proxy(routeId: number, method: Method, pathname: string) {
    return async (raw: R): Promise<unknown> => {
      const handler = this.registry.get(routeId);
      if (!handler) {
        throw new Error(`[Tunnel] Route Not Found: ${routeId}`);
      }

      const ctx = this.adapter.transform(raw, pathname, method);
      return await handler(ctx);
    };
  }

  private parse(key: string): [Method, string] {
    const idx = key.indexOf(' ');
    if (idx === -1) throw new Error(`[Tunnel] Invalid Endpoint: "${key}"`);

    const method = key.slice(0, idx).toUpperCase() as Method;
    const pathname = key.slice(idx + 1);

    return [method, pathname];
  }
}
