import { describe, expect, it, vi } from 'vitest';

import Signal from './index';

interface TestEvents {
  ready: { ok: boolean };
  error: Error;
  done: void;
}

describe('Signal', () => {
  it('向匹配的监听器发送带类型的事件载荷', () => {
    const signal = new Signal<TestEvents>();
    const handler = vi.fn();

    signal.on('ready', handler);
    signal.emit('ready', { ok: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ ok: true });
  });

  it('支持通配符监听器', () => {
    const signal = new Signal<TestEvents>();
    const wildcard = vi.fn();

    signal.on('*', wildcard);
    signal.emit('error', new Error('boom'));

    expect(wildcard).toHaveBeenCalledTimes(1);
    expect(wildcard.mock.calls[0]?.[0]).toBe('error');
    expect(wildcard.mock.calls[0]?.[1]).toBeInstanceOf(Error);
  });

  it('只执行一次 once 监听器', () => {
    const signal = new Signal<TestEvents>();
    const handler = vi.fn();

    signal.once('ready', handler);
    signal.emit('ready', { ok: true });
    signal.emit('ready', { ok: false });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ ok: true });
  });

  it('可以通过原始处理函数引用移除 once 监听器', () => {
    const signal = new Signal<TestEvents>();
    const handler = vi.fn();

    signal.once('error', handler);
    signal.off('error', handler);
    signal.emit('error', new Error('boom'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('可以清除事件级和全局监听器', () => {
    const signal = new Signal<TestEvents>();
    const readyHandler = vi.fn();
    const wildcard = vi.fn();

    signal.on('ready', readyHandler);
    signal.on('*', wildcard);

    signal.off('ready');
    signal.emit('ready', { ok: true });

    expect(readyHandler).not.toHaveBeenCalled();
    expect(wildcard).toHaveBeenCalledTimes(1);

    signal.clear();
    signal.emit('done');

    expect(wildcard).toHaveBeenCalledTimes(1);
  });
});
