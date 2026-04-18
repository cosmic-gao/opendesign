import type { Hono as App, Context as Raw } from 'hono';
import type { Method } from '../utils';
import type { Context, Reply } from '../types';
import type { Adapter } from '../adapter';

/** Hono 标准 HTTP 方法（类型系统已知） */
type HonoStandardMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

/** Hono HTTP 方法（包括非标准方法） */
type HonoMethod = HonoStandardMethod | 'head' | 'options';

/**
 * Hono 框架适配器
 * 将 Tunnel 路由系统桥接到 Hono 框架
 */
export class Hono implements Adapter<App, Raw> {
  /** 路由映射表，用于追踪已注册的路由 */
  private readonly routes = new Map<string, string>();

  /**
   * 创建 Hono 适配器实例
   * @param app - Hono 应用实例
   */
  public constructor(public readonly app: App) { }

  /** 适配器名称 */
  readonly name = 'hono';

  /**
   * 注册路由到 Hono 应用
   * @param method - HTTP 方法
   * @param pathname - 路由路径
   * @param proxy - 代理函数
   */
  register(
    method: Method,
    pathname: string,
    proxy: (raw: Raw) => Promise<unknown>
  ): void {
    const key = `${method} ${pathname}`;
    const action = method.toLowerCase() as HonoMethod;

    const handler: (c: Raw) => Promise<Response> = async (c: Raw): Promise<Response> => {
      try {
        const result = await proxy(c);
        return reply(result, c);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.startsWith('[Tunnel] Route Not Found:')) {
            return c.notFound();
          }
          throw error;
        }
        throw new Error(String(error));
      }
    };

    const app = this.app as unknown as Record<HonoMethod, (path: string, handler: (c: Raw) => Promise<Response>) => void>;
    const methodHandler = app[action];

    if (typeof methodHandler === 'function') {
      methodHandler.call(this.app, pathname, handler);
      this.routes.set(key, action);
    } else {
      throw new Error(`[Tunnel] Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * 从 Hono 应用卸载路由
   * @param method - HTTP 方法
   * @param pathname - 路由路径
   * @returns 是否成功卸载
   */
  unregister(method: Method, pathname: string): boolean {
    const key = `${method} ${pathname}`;
    const existed = this.routes.has(key);
    this.routes.delete(key);
    return existed;
  }

  /**
   * 解析请求体
   * 根据 Content-Type 自动选择解析方式：
   * - application/json: json()
   * - application/x-www-form-urlencoded: text()
   * - multipart/form-data: formData()
   * - 其他: text()
   * @param raw - Hono 请求上下文
   * @returns 解析后的请求体
   */
  async body(raw: Raw): Promise<unknown> {
    const contentType = raw.req.header('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return await raw.req.json();
      } catch {
        return undefined;
      }
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const text = await raw.req.text();
        return text || undefined;
      } catch {
        return undefined;
      }
    }
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await raw.req.formData();
        return formData;
      } catch {
        return undefined;
      }
    }
    try {
      const text = await raw.req.text();
      return text || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * 转换 Hono 请求为统一 Context 对象
   * @template L - Body/Load 类型
   * @param raw - Hono 请求上下文（已包含 body）
   * @param pathname - 注册时的路由路径
   * @param method - HTTP 方法
   * @returns 统一的上下文对象
   */
  async transform<L = unknown>(raw: Raw, pathname: string, method: Method): Promise<Context<Raw, L>> {
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

    const headers: Record<string, string | string[]> = {};
    raw.req.raw.headers.forEach((value, key) => {
      const existing = headers[key];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          headers[key] = [existing, value];
        }
      } else {
        headers[key] = value;
      }
    });

    const body = await this.body(raw);

    return Object.freeze({
      method,
      pathname,
      path: url.pathname,
      params,
      query,
      headers,
      body: body as L,
      raw,
    });
  }
}

/**
 * 处理 Reply 响应
 * - 如果是 Response 对象，直接返回
 * - 否则序列化为 JSON 响应
 * @template R - 响应数据类型
 * @param result - 响应数据
 * @param c - Hono 上下文
 * @returns Response 对象
 */
function reply<R>(result: Reply<R>, c: Raw): Response {
  if (result instanceof Response) {
    return result;
  }
  return c.json(result);
}

/**
 * 快捷创建 Hono 适配器实例
 * @param app - Hono 应用实例
 * @returns Hono 适配器实例
 */
export function createHonoAdapter(app: App): Hono {
  return new Hono(app);
}