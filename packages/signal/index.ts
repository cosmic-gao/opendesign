/**
 * @openspace/signal
 * 
 * 轻量级、类型安全的事件发射器，支持通配符监听。
 */

export type EventType = string | symbol;

export type Handler<T = any> = (event: T) => void;
export type WildcardHandler<E = Record<string, any>> = (
  type: keyof E,
  event: E[keyof E]
) => void;

/**
 * 内部使用的监听器定义，用于存储 once 的原始处理程序引用
 */
export type Listener<T = any> = Handler<T> & { source?: Handler<T> | WildcardHandler<any> };

export type EventHandlerList<T = any> = Array<Listener<T> | WildcardHandler<any>>;
export type EventHandlerMap<E = Record<string, any>> = Map<
  keyof E | '*',
  EventHandlerList<E[keyof E] | E>
>;

/**
 * Signal 接口定义
 */
export interface Emitter<E extends Record<EventType, any>> {
  all: EventHandlerMap<E>;

  on<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void;
  on(type: '*', handler: WildcardHandler<E>): () => void;

  once<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void;
  once(type: '*', handler: WildcardHandler<E>): () => void;

  off<K extends keyof E>(type: K, handler?: Handler<E[K]>): void;
  off(type: '*', handler?: WildcardHandler<E>): void;

  emit<K extends keyof E>(type: K, event: E[K]): void;
  emit<K extends keyof E>(type: undefined extends E[K] ? K : never): void;

  clear(): void;
}

/**
 * Signal 类实现
 */
export class Signal<E extends Record<EventType, any> = Record<string, any>> implements Emitter<E> {
  public all = new Map<keyof E | '*', EventHandlerList>();

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
  public on<K extends keyof E>(type: K | '*', handler: Handler<E[K]> | WildcardHandler<E>): () => void {
    const handlers = this.all.get(type);
    if (handlers) {
      handlers.push(handler as Listener);
    } else {
      this.all.set(type, [handler as Listener] as EventHandlerList);
    }

    return () => this.off(type, handler);
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
  public once<K extends keyof E>(type: K | '*', handler: Handler<E[K]> | WildcardHandler<E>): () => void {
    const wrapper = ((...args: any[]) => {
      this.off(type, wrapper);
      return (handler as Function).apply(this, args);
    }) as Listener;

    // 保存原始handler引用以便off能正确移除(如果在触发前手动调用off)
    wrapper.source = handler;

    return this.on(type, wrapper);
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
  public off<K extends keyof E>(type: K | '*', handler?: Handler<E[K]> | WildcardHandler<E>): void {
    const handlers = this.all.get(type);
    if (!handlers) return;

    if (handler) {
      // 查找 handler 或其原始 handler (针对 once 封装的情况)
      const index = handlers.findIndex(h =>
        h === handler || (h as Listener).source === handler
      );

      if (index !== -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.all.set(type, []);
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
  public emit<K extends keyof E>(type: K, event?: E[K]): void {
    // 触发具体事件监听器
    const handlers = this.all.get(type);
    if (handlers) {
      // 使用 slice() 创建浅拷贝，防止在事件处理中修改监听器列表导致的问题
      for (const handler of handlers.slice()) {
        try {
          (handler as Handler<E[K]>)(event!);
        } catch (e) {
          console.error(`[Signal] Error in handler for event "${String(type)}":`, e);
        }
      }
    }

    // 触发通配符监听器 ('*')
    const wildcards = this.all.get('*');
    if (wildcards) {
      for (const handler of wildcards.slice()) {
        try {
          (handler as WildcardHandler<E>)(type, event!);
        } catch (e) {
          console.error(`[Signal] Error in wildcard handler for event "${String(type)}":`, e);
        }
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
