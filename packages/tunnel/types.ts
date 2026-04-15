import type { Method, Endpoint } from './utils';
import type { Response } from './response';

export type Awaitable<T> = T | Promise<T>;

export interface Context<R = unknown> {
  readonly method: Method;
  readonly pathname: string;
  readonly path: string;
  readonly query: Record<string, string | string[] | undefined>;
  readonly params: Record<string, string | undefined>;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body: unknown;
  readonly raw: R;
}

export type Reply<T = unknown> =
  | T
  | Response
  | AsyncIterable<T>
  | SockletUpgrade;

export type Handler<R = unknown, T = unknown> = (
  ctx: Context<R>
) => Awaitable<Reply<T>>;

export interface TunnelHandler<R = unknown, T = unknown> {
  readonly method: Method;
  readonly endpoint: Endpoint;
  readonly handler: Handler<R, T>;
}

export class SockletUpgrade {
  public constructor(public readonly socklet: Socklet) {}
}

export interface Socket {
  send(data: unknown): void;
  close(): void;
}

export interface Socklet {
  onopen?: (ws: Socket) => void;
  onmessage?: (data: unknown, ws: Socket) => void;
  onclose?: (code: number, reason: string, ws: Socket) => void;
  onerror?: (error: Error, ws: Socket) => void;
}
