/**
 * @opendesign/signal
 * 
 * 轻量级、类型安全的事件发射器，支持通配符监听。
 */

export type EventName = string | symbol;
export type Events = Record<EventName, unknown>;
export type Names<E extends Events> = Extract<keyof E, EventName>;

export type Handler<T = unknown> = (event: T) => void;
export type WildcardHandler<E extends Events = Events> = (
  type: Names<E>,
  event: E[Names<E>]
) => void;

type Callback<E extends Events> = Handler<E[Names<E>]> | WildcardHandler<E>;

/**
 * 内部使用的监听器定义，用于存储 once 的原始处理程序引用
 */
export type Listener<T = unknown, S = Handler<T>> = Handler<T> & { source?: S };

export type Handlers<E extends Events> = Array<
  Listener<E[Names<E>], Callback<E>> | WildcardHandler<E>
>;
export type Registry<E extends Events> = Map<
  Names<E> | '*',
  Handlers<E>
>;

/**
 * Signal 接口定义
 */
export interface Emitter<E extends Events> {
  all: Registry<E>;

  on<K extends Names<E>>(type: K, handler: Handler<E[K]>): () => void;
  on(type: '*', handler: WildcardHandler<E>): () => void;

  once<K extends Names<E>>(type: K, handler: Handler<E[K]>): () => void;
  once(type: '*', handler: WildcardHandler<E>): () => void;

  off<K extends Names<E>>(type: K, handler?: Handler<E[K]>): void;
  off(type: '*', handler?: WildcardHandler<E>): void;

  emit<K extends Names<E>>(type: K, event: E[K]): void;
  emit<K extends Names<E>>(type: undefined extends E[K] ? K : never): void;

  clear(): void;
}

/**
 * Signal 类实现
 */
export class Signal<E extends Events = Record<string, unknown>> implements Emitter<E> {
  public all = new Map<Names<E> | '*', Handlers<E>>();

  /**
   * 监听事件
   * 
   * @param type 事件类型或 '*'
   * @param handler 处理函数
   * @returns 取消订阅函数
   * 
   * @example
   * ```typescript
   * const off = signal.on('login', (user) => console.log(user));
   * off(); // 取消监听
   * ```
   */
  public on<K extends Names<E>>(type: K, handler: Handler<E[K]>): () => void;
  public on(type: '*', handler: WildcardHandler<E>): () => void;
  public on(type: Names<E> | '*', handler: Callback<E>): () => void {
    const handlers = this.all.get(type);
    const nextHandler = handler as Handlers<E>[number];

    if (handlers) {
      handlers.push(nextHandler);
    } else {
      this.all.set(type, [nextHandler]);
    }

    return () => {
      if (type === '*') {
        this.off('*', handler as WildcardHandler<E>);
        return;
      }

      this.off(type, handler as Handler<E[typeof type]>);
    };
  }

  /**
   * 监听一次性事件
   * 
   * @param type 事件类型或 '*'
   * @param handler 处理函数
   * @returns 取消订阅函数
   * 
   * @example
   * ```typescript
   * signal.once('init', () => console.log('Initialized'));
   * ```
   */
  public once<K extends Names<E>>(type: K, handler: Handler<E[K]>): () => void;
  public once(type: '*', handler: WildcardHandler<E>): () => void;
  public once(type: Names<E> | '*', handler: Callback<E>): () => void {
    const wrapper = ((...args: unknown[]) => {
      if (type === '*') {
        this.off('*', wrapper as unknown as WildcardHandler<E>);
      } else {
        this.off(type, wrapper as Handler<E[typeof type]>);
      }

      return (handler as (...event: unknown[]) => void)(...args);
    }) as Listener<E[Names<E>], Callback<E>>;

    // 保存原始handler引用以便off能正确移除(如果在触发前手动调用off)
    wrapper.source = handler;

    if (type === '*') {
      return this.on('*', wrapper as unknown as WildcardHandler<E>);
    }

    return this.on(type, wrapper as Handler<E[typeof type]>);
  }

  /**
   * 取消监听
   * 
   * @param type 事件类型或 '*'
   * @param handler 处理函数
   * 
   * @example
   * ```typescript
   * signal.off('login', loginHandler);
   * signal.off('login'); // 移除所有 login 监听器
   * ```
   */
  public off<K extends Names<E>>(type: K, handler?: Handler<E[K]>): void;
  public off(type: '*', handler?: WildcardHandler<E>): void;
  public off(type: Names<E> | '*', handler?: Callback<E>): void {
    const handlers = this.all.get(type);
    if (!handlers) return;

    if (!handler) {
      this.all.delete(type);
      return;
    }

    // 查找 handler 或其原始 handler (针对 once 封装的情况)
    const index = handlers.findIndex(h =>
      h === handler || (h as Listener<E[Names<E>], Callback<E>>).source === handler
    );

    if (index !== -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.all.delete(type);
    }
  }

  /**
   * 触发事件
   * 
   * @param type 事件类型
   * @param event 事件数据
   * 
   * @example
   * ```typescript
   * signal.emit('login', { id: 1 });
   * ```
   */
  public emit<K extends Names<E>>(type: K, event: E[K]): void;
  public emit<K extends Names<E>>(type: undefined extends E[K] ? K : never): void;
  public emit<K extends Names<E>>(type: K, event?: E[K]): void {
    // 触发具体事件监听器
    const handlers = this.all.get(type);
    if (handlers) {
      // 使用 slice() 创建浅拷贝，防止在事件处理中修改监听器列表导致的问题
      for (const handler of handlers.slice()) {
        (handler as Handler<E[K]>)(event!);
      }
    }

    // 触发通配符监听器 ('*')
    const wildcards = this.all.get('*');
    if (wildcards) {
      for (const handler of wildcards.slice()) {
        (handler as WildcardHandler<E>)(type, event!);
      }
    }
  }

  /**
   * 清空所有监听器
   * 
   * @example
   * ```typescript
   * signal.clear();
   * ```
   */
  public clear(): void {
    this.all.clear();
  }
}

export default Signal;
