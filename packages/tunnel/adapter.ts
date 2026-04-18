import type { Method } from './utils';
import type { Context } from './types';

/**
 * 适配器接口，定义与底层框架的交互规范
 * @template T - App 类型，表示底层框架的应用实例
 * @template P - Platform 类型，表示底层框架的请求上下文
 */
export interface Adapter<T, P> {
  /** 底层框架的应用实例 */
  readonly app: T;
  /** 适配器名称 */
  readonly name: string;

  /**
   * 注册路由处理器到底层框架
   * @param method - HTTP 方法
   * @param pathname - 路由路径
   * @param proxy - 代理函数，接收原始请求并返回处理结果
   */
  register(
    method: Method,
    pathname: string,
    proxy: (raw: P) => Promise<unknown>
  ): void;

  /**
   * 从底层框架卸载路由
   * @param method - HTTP 方法
   * @param pathname - 路由路径
   * @returns 是否成功卸载
   */
  unregister(method: Method, pathname: string): boolean;

  /**
   * 转换底层框架的原始请求为统一 Context 对象
   * @template L - Body/Load 类型
   * @param raw - 底层框架的原始请求对象
   * @param pathname - 注册时的路由路径
   * @param method - HTTP 方法
   * @returns 统一的上下文对象
   */
  transform<L = unknown>(raw: P, pathname: string, method: Method): Promise<Context<P, L>>;
}
