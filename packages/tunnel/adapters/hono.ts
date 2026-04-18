import type { Hono as HonoApp, Context as HonoContext } from 'hono';
import type { Method } from '../utils';
import type { Context, Reply } from '../types';
import type { Adapter } from '../adapter';

export class Hono implements Adapter<HonoContext> {
  public constructor(private readonly app: HonoApp) {}

  readonly name = 'hono';

  register(
    method: Method,
    pathname: string,
    proxy: (raw: HonoContext) => Promise<unknown>
  ): void {
    const handler = async (c: HonoContext) => {
      try {
        const result = await proxy(c);
        return await reply(result, c);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(String(error));
      }
    };

    const m = method.toLowerCase() as keyof HonoApp;
    (this.app[m] as any)(pathname, handler);
  }

  transform(raw: HonoContext, pathname: string, method: Method): Context<HonoContext> {
    const url = new URL(raw.req.url);

    const query: Record<string, string | string[] | undefined> = {};
    for (const [key, value] of url.searchParams.entries()) {
      const existing = query[key];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          query[key] = [existing, value];
        }
      } else {
        query[key] = value;
      }
    }

    const params = raw.req.param();
    const headers = Object.fromEntries(raw.req.raw.headers.entries());

    return Object.freeze({
      method,
      pathname,
      path: url.pathname,
      params,
      query,
      headers,
      body: undefined,
      raw,
    });
  }
}

async function reply<T>(result: Reply<T>, c: HonoContext): Promise<Response> {
  if (result instanceof Response) {
    return result;
  }
  return c.json(result);
}