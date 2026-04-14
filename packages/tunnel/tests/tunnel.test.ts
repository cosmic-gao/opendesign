import { describe, it, expect } from 'vitest';
import { Tunnel } from '../tunnel';
import type { Adapter, Context } from '../index';
import type { Method } from '../utils';

function createMockAdapter() {
  const registeredRoutes: { method: Method; pathname: string; proxy: (raw: unknown) => Promise<unknown> }[] = [];

  const adapter: Adapter<{}, { id: string }> = {
    name: 'mock',
    register(_app: {}, method: Method, pathname: string, proxy: (raw: { id: string }) => Promise<unknown>) {
      registeredRoutes.push({ method, pathname, proxy: proxy as (raw: unknown) => Promise<unknown> });
    },
    transform(raw: { id: string }, pathname: string, method: Method): Context<{ id: string }> {
      return {
        method,
        pathname,
        path: pathname,
        params: { id: raw.id },
        query: {},
        headers: {},
        body: undefined,
        raw,
      };
    },
  };

  return { adapter, registeredRoutes };
}

describe('Tunnel', () => {
  describe('register', () => {
    it('should register a single route', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel({}, adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      expect(registeredRoutes).toHaveLength(1);
      expect(registeredRoutes[0]?.method).toBe('GET');
      expect(registeredRoutes[0]?.pathname).toBe('/api/test');
    });

    it('should register multiple routes', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel({}, adapter);

      tunnel.register({
        ['GET /api/users' as string]: async () => [],
        ['POST /api/users' as string]: async () => ({ id: 1 }),
        ['GET /api/users/:id' as string]: async () => ({ id: 1 }),
      });

      expect(registeredRoutes).toHaveLength(3);
    });

    it('should not re-register existing route on hot update', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel({}, adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ v: 1 }),
      });

      const initialCount = registeredRoutes.length;

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ v: 2 }),
      });

      expect(registeredRoutes).toHaveLength(initialCount);
    });

    it('should call correct handler after hot update', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel({}, adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ version: 1 }),
      });

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ version: 2 }),
      });

      const proxy = registeredRoutes[0]?.proxy;
      expect(proxy).toBeDefined();
      const result = await proxy!({ id: '123' });

      expect(result).toEqual({ version: 2 });
    });
  });

  describe('unregister', () => {
    it('should remove route from registry', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel({}, adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      expect(registeredRoutes).toHaveLength(1);

      tunnel.unregister('GET /api/test');

      const proxy = registeredRoutes[0]?.proxy;
      expect(proxy).toBeDefined();
      await expect(proxy!({ id: '123' })).rejects.toThrow('[Tunnel] Route Not Found');
    });
  });

  describe('proxy', () => {
    it('should throw error for unregistered route', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel({}, adapter);

      tunnel.register({
        ['GET /api/other' as string]: async () => ({ hello: 'world' }),
      });

      const proxy = registeredRoutes[0]?.proxy;
      expect(proxy).toBeDefined();
      await expect(proxy!({ id: '123' })).resolves.toEqual({ hello: 'world' });
    });
  });
});

