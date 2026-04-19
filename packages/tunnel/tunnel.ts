import { hash, HTTP_METHODS, type Method, type Endpoint } from './utils';
import type { Handler, Routes } from './types';
import type { Adapter } from './adapter';

/** 
 * 运行时合法的 HTTP 方法集合
 * 动态基于 utils 中的 HTTP_METHODS 构建，用于 parse() 时进行运行时的严格安全校验
 */
const VALID_METHODS = new Set<Method>(
  HTTP_METHODS.map((m) => m.toUpperCase() as Method)
);

/** 内部路由记录结构 */
interface Route<P> {
  /** 路由键，格式为 "METHOD /path" */
  key: string;
  /** HTTP 方法 */
  method: Method;
  /** 路由路径 */
  pathname: string;
  /** 处理器函数 */
  handler: Handler<P>;
}

/**
 * Tunnel 路由管理器接口
 * @template T - App 类型，底层框架应用实例
 * @template P - Platform 类型，底层框架请求上下文
 */
export interface Tunnel<T, P> {
  /**
   * 批量注册路由
   * @param routes - 路由表对象，键为 "METHOD /path" 格式，值为处理器函数
   */
  register<const R extends Routes<P>>(routes: R): void;
  /**
   * 卸载路由
   * @param key - 路由键，格式为 "METHOD /path"，支持 ** 通配符批量卸载
   * @returns 是否成功卸载
   */
  unregister(key: string): boolean;
  /**
   * 检查路由是否已注册
   * @param key - 路由键
   * @returns 是否存在
   */
  has(key: string): boolean;
}

/**
 * 跨框架路由适配器核心引擎
 * 通过 FNV-1a 哈希实现 O(1) 路由查找和热更新
 * @template T - App 类型，底层框架应用实例
 * @template P - Platform 类型，底层框架请求上下文
 */
export class Tunnel<T, P> {
  /** 路由注册表，使用哈希作为键 */
  private readonly registry = new Map<number, Route<P>>();

  /**
   * 创建 Tunnel 实例
   * @param adapter - 适配器实例，负责与底层框架交互
   */
  public constructor(
    private readonly adapter: Adapter<T, P>
  ) { }

  /**
   * 批量注册路由，支持热更新
   * 相同 key 的路由会被覆盖
   * @param routes - 路由表
   */
  public register<const R extends Routes<P>>(routes: R): void {
    for (const [key, handler] of Object.entries(routes)) {
      const [method, pathname] = this.parse(key);
      const endpoint = `${method} ${pathname}` as Endpoint;
      const routeId = hash(endpoint);

      const isLinked = this.registry.has(routeId);

      const route: Route<P> = { key, method, pathname, handler };
      this.registry.set(routeId, route);

      if (!isLinked) {
        this.adapter.register?.(
          method,
          pathname,
          this.proxy(routeId)
        );
      }
    }
  }

  /**
   * 检查路由是否已注册
   * @param key - 路由键，格式为 "METHOD /path"
   * @returns 是否存在
   */
  public has(key: string): boolean {
    const [method, pathname] = this.parse(key);
    const routeId = hash(`${method} ${pathname}`);
    return this.registry.has(routeId);
  }

  /**
   * 卸载路由
   * - 使用 ** 后缀可以批量卸载匹配前缀的路由
   * - 单独的 * 或 ** 被拒绝
   * @param key - 路由键
   * @returns 是否成功卸载
   */
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
          this.adapter.unregister?.(route.method, route.pathname);
          deleted = true;
        }
      }
      return deleted;
    }

    const [method, pathname] = this.parse(key);
    const routeId = hash(`${method} ${pathname}`);
    const existed = this.registry.has(routeId);
    this.registry.delete(routeId);
    this.adapter.unregister?.(method, pathname);
    return existed;
  }

  /** 创建路由代理函数 */
  private proxy(routeId: number) {
    return async (raw: P): Promise<unknown> => {
      const route = this.registry.get(routeId);
      if (!route) {
        throw new Error(`[Tunnel] Route Not Found: ${routeId}`);
      }
      const ctx = await this.adapter.transform(raw, route.pathname, route.method);
      return await route.handler(ctx);
    };
  }

  /**
   * 解析路由键
   * @param key - 路由键，格式为 "METHOD /path"
   * @returns [method, pathname] 元组
   * @throws 如果格式无效或 HTTP 方法不合法
   */
  private parse(key: string): [Method, string] {
    const idx = key.indexOf(' ');
    if (idx === -1) throw new Error(`[Tunnel] Invalid Endpoint: "${key}"`);

    const method = key.slice(0, idx).toUpperCase() as Method;
    if (!VALID_METHODS.has(method)) {
      throw new Error(`[Tunnel] Invalid HTTP Method: "${method}"`);
    }
    const pathname = key.slice(idx + 1);

    return [method, pathname];
  }
}