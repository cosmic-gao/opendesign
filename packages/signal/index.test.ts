import { describe, expect, it, vi } from 'vitest';

import Signal from './index';

interface TestEvents {
  ready: { ok: boolean };
  error: Error;
  done: void;
}

describe('Signal', () => {
  it('emits typed payloads to matching handlers', () => {
    const signal = new Signal<TestEvents>();
    const handler = vi.fn();

    signal.on('ready', handler);
    signal.emit('ready', { ok: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ ok: true });
  });

  it('supports wildcard listeners', () => {
    const signal = new Signal<TestEvents>();
    const wildcard = vi.fn();

    signal.on('*', wildcard);
    signal.emit('error', new Error('boom'));

    expect(wildcard).toHaveBeenCalledTimes(1);
    expect(wildcard.mock.calls[0]?.[0]).toBe('error');
    expect(wildcard.mock.calls[0]?.[1]).toBeInstanceOf(Error);
  });

  it('runs once handlers only once', () => {
    const signal = new Signal<TestEvents>();
    const handler = vi.fn();

    signal.once('ready', handler);
    signal.emit('ready', { ok: true });
    signal.emit('ready', { ok: false });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ ok: true });
  });

  it('removes once handlers by original handler reference', () => {
    const signal = new Signal<TestEvents>();
    const handler = vi.fn();

    signal.once('error', handler);
    signal.off('error', handler);
    signal.emit('error', new Error('boom'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears event-specific and global listeners', () => {
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
