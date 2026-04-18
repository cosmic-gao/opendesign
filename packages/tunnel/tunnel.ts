import { hash, type Method, type Endpoint } from './utils';
import type { Handler } from './types';
import type { Adapter } from './adapter';

interface Route<R> {
  key: string;
  method: Method;
  pathname: string;
  handler: Handler<R>;
}

export interface Tunnel<App, R> {
  register<const Routes extends Record<string, Handler<R>>>(routes: Routes): void;
  unregister(key: string): boolean;
  has(key: string): boolean;
}

export class Tunnel<App, R> {
  private readonly registry = new Map<number, Route<R>>();

  public constructor(
    app: App,
    private readonly adapter: Adapter<R>
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void app;
  }

  public register<const Routes extends Record<string, Handler<R>>>(routes: Routes): void {
    for (const [key, handler] of Object.entries(routes)) {
      const [method, pathname] = this.parse(key);
      const endpoint = `${method} ${pathname}` as Endpoint;
      const routeId = hash(endpoint);

      const isLinked = this.registry.has(routeId);

      const route: Route<R> = { key, method, pathname, handler };
      this.registry.set(routeId, route);

      if (!isLinked) {
        this.adapter.register(
          method,
          pathname,
          this.proxy(routeId)
        );
      }
    }
  }

  public has(key: string): boolean {
    const [method, pathname] = this.parse(key);
    const routeId = hash(`${method} ${pathname}`);
    return this.registry.has(routeId);
  }

  public unregister(key: string): boolean {
    if (key === '*' || key === '**') {
      return false;
    }

    if (key.endsWith('**')) {
      const prefix = key.slice(0, -2);
      let deleted = false;
      for (const [id, route] of this.registry) {
        if (route.key.startsWith(prefix)) {
          this.registry.delete(id);
          deleted = true;
        }
      }
      return deleted;
    }

    const [method, pathname] = this.parse(key);
    const routeId = hash(`${method} ${pathname}`);
    const existed = this.registry.has(routeId);
    this.registry.delete(routeId);
    return existed;
  }

  private proxy(routeId: number) {
    return async (raw: R): Promise<unknown> => {
      const route = this.registry.get(routeId);
      if (!route) {
        throw new Error(`[Tunnel] Route Not Found: ${routeId}`);
      }
      const ctx = this.adapter.transform(raw, route.pathname, route.method);
      return await route.handler(ctx);
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