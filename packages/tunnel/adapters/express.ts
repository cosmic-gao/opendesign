import type { Express, Request, Response } from 'express';
import type { ServerResponse } from 'node:http';
import type { Method } from '../utils';
import { type Context, SockletUpgrade } from '../types';
import type { Adapter } from '../adapter';
import { Response as TunnelResponse } from '../response';

type ExpressContext = Request;
type ExpressApp = Express;

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

export function createExpressAdapter(): Adapter<ExpressApp, ExpressContext> {
  return {
    name: 'express',

    register(
      app: ExpressApp,
      method: Method,
      pathname: string,
      proxy: (raw: ExpressContext) => Promise<unknown>
    ): void {
      const handler = async (req: Request, res: Response, next: (err?: Error) => void) => {
        try {
          const result = await proxy(req);
          await sendReply(result, res);
        } catch (error) {
          // 确保错误能够正确地抛给框架的错误处理中间件
          next(error instanceof Error ? error : new Error(String(error)));
        }
      };

      const routeMethod = app[method.toLowerCase() as keyof ExpressApp] as (
        path: string,
        ...handlers: ((req: Request, res: Response, next: (err?: Error) => void) => void)[]
      ) => ExpressApp;

      routeMethod(pathname, handler);
    },

    transform(raw: Request, pathname: string, method: Method): Context<ExpressContext> {
      // 获取真实请求路径（去除 query string）
      const url = raw.originalUrl ?? raw.url ?? '/';
      const path = url.split('?')[0] ?? '/';

      // 直接使用 express 提供的对象，实现零开销映射，避免不必要的对象创建（如 URLSearchParams/Headers/Params拷贝）
      return Object.freeze({
        method,
        pathname,
        path,
        params: raw.params as Record<string, string | undefined>,
        query: raw.query as Record<string, string | string[] | undefined>,
        headers: raw.headers as Record<string, string | string[] | undefined>,
        body: raw.body, // 引入解析后的 body 
        raw,
      });
    },
  };
}

async function sendReply(result: unknown, res: Response): Promise<void> {
  if (isTunnelResponse(result)) {
    res.status(result.status);
    
    // 直接遍历普通对象的 headers，避免使用 DOM Headers 的性能开销
    for (const [key, value] of Object.entries(result.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }

    if (result.body !== null && result.body !== undefined) {
      res.send(result.body);
    } else {
      res.end();
    }
    return;
  }

  if (isAsyncIterable(result)) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result) {
      if ((res as ServerResponse).writableEnded) break;
      (res as ServerResponse).write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    (res as ServerResponse).end();
    return;
  }

  if (isSockletUpgrade(result)) {
    throw new Error('[ExpressAdapter] WebSocket upgrade not implemented - require express-ws integration');
  }

  res.json(result);
}
