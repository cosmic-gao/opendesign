import type { Method } from './utils';

/**
 * 表示一个值可以是同步或异步的类型别名
 * @template T - 同步值的类型
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * 请求上下文对象，包含请求的所有相关信息
 * @template P - Platform 类型，表示底层框架的请求对象
 * @template L - Load 类型，默认 unknown，由使用者在需要时通过泛型或断言处理
 */
export interface Context<P = unknown, L = unknown> {
  /** HTTP 请求方法 */
  readonly method: Method;
  /** 注册时的路由路径（可能包含参数占位符） */
  readonly pathname: string;
  /** 实际请求的路径（已解析参数） */
  readonly path: string;
  /** 查询参数，多值时为数组 */
  readonly query: Record<string, string | string[] | undefined>;
  /** 路径参数，键为参数名 */
  readonly params: Record<string, string | undefined>;
  /** 请求头，多值时为数组 */
  readonly headers: Record<string, string | string[] | undefined>;
  /** 请求体，已根据 Content-Type 自动解析 */
  readonly body: L;
  /** 原始底层框架的请求对象 */
  readonly raw: P;
}

/**
 * 响应类型，可以是纯数据或 Response 对象
 * - 返回数据时，自动序列化为 JSON
 * - 返回 Response 对象时，直接透传
 * @template R - 响应数据的类型
 */
export type Reply<R = unknown> = R | Response;

/**
 * 路由处理器函数
 * @template P - Platform 类型
 * @template R - Response 类型
 * @template L - Load/Body 类型
 * @param ctx - 请求上下文对象
 * @returns 可以是同步数据或 Promise，最终返回 Reply<R>
 */
export type Handler<P = unknown, R = unknown, L = unknown> = (ctx: Context<P, L>) => Awaitable<Reply<R>>;

/**
 * 路由表类型，是路由键到处理器的映射
 * @template P - Platform 类型
 */
export type Routes<P = unknown> = Record<string, Handler<P, any, any>>;

/**
 * 响应头初始化类型，支持三种格式：
 * - 对象: { 'Content-Type': 'application/json' }
 * - 数组: [['Content-Type', 'application/json']]
 * - Headers 实例
 */
export type ResponseHeadersInit =
  | Record<string, string | string[]>
  | [string, string][]
  | Headers;

/**
 * HTTP 状态码的联合类型，包含标准状态码和扩展状态码
 */
export type StatusCode =
  | 100 | 101 | 102 | 103
  | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
  | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308
  | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 | 599
  | number;