import type { Hono, Context as HonoContext } from 'hono';
import type { Method } from '../utils';
import { type Context, SockletUpgrade } from '../types';
import type { Adapter } from '../adapter';
import { Response as TunnelResponse } from '../response';

function isTunnelResponse(value: unknown): value is TunnelResponse {
  return value instanceof TunnelResponse;
}

function isSockletUpgrade(value: unknown): value is SockletUpgrade {
  return value instanceof SockletUpgrade;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.asyncIterator in value
  );
}

export function createHonoAdapter(): Adapter<Hono, HonoContext> {
  return {
    name: 'hono',

    register(
      app: Hono,
      method: Method,
      pathname: string,
      proxy: (raw: HonoContext) => Promise<unknown>
    ): void {
      const handler = async (c: HonoContext) => {
        try {
          const result = await proxy(c);
          return await sendReply(result, c);
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(String(error));
        }
      };

      // Ensure lowercase method name (e.g. 'get', 'post')
      const m = method.toLowerCase() as keyof Hono;
      // Note: Cast is needed because Hono's method types might not perfectly align with our Method type
      (app[m] as any)(pathname, handler);
    },

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

      // Note: getting body synchronously is not possible in standard Fetch API
      // It should be handled asynchronously before `transform` or inside the handler if needed.
      // We set it to undefined for now to match the Context interface structure
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
    },
  };
}

async function sendReply(result: unknown, c: HonoContext): Promise<Response> {
  if (isTunnelResponse(result)) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(result.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, String(v));
          }
        } else {
          headers.set(key, String(value));
        }
      }
    }

    let bodyInit: string | Blob | ArrayBuffer | FormData | URLSearchParams | ReadableStream | null = null;
    if (result.body !== null && result.body !== undefined) {
        if (
          typeof result.body === 'string' ||
          result.body instanceof Blob ||
          result.body instanceof ArrayBuffer ||
          result.body instanceof FormData ||
          result.body instanceof URLSearchParams ||
          result.body instanceof ReadableStream
        ) {
          bodyInit = result.body;
        } else {
          bodyInit = JSON.stringify(result.body);
          if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
          }
        }
    }

    return new Response(bodyInit, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  }

  if (isAsyncIterable(result)) {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  if (isSockletUpgrade(result)) {
    throw new Error('[HonoAdapter] WebSocket upgrade not fully implemented - requires environment specific websocket support (e.g. Bun, Cloudflare Workers, Node.js ws)');
  }

  return c.json(result);
}
