import { describe, it, expect } from 'vitest';
import { Tunnel } from '../tunnel';
import type { Adapter, Context } from '../index';
import type { Method } from '../utils';

function createMockAdapter() {
  const registeredRoutes: { method: Method; pathname: string; proxy: (raw: unknown) => Promise<unknown> }[] = [];

  const mockApp = { mock: true };

  const adapter: Adapter<typeof mockApp, { id: string }> = {
    app: mockApp,
    name: 'mock',
    register(method: Method, pathname: string, proxy: (raw: { id: string }) => Promise<unknown>) {
      registeredRoutes.push({ method, pathname, proxy: proxy as (raw: unknown) => Promise<unknown> });
    },
    unregister(method: Method, pathname: string): boolean {
      const idx = registeredRoutes.findIndex(r => r.method === method && r.pathname === pathname);
      if (idx !== -1) {
        registeredRoutes.splice(idx, 1);
        return true;
      }
      return false;
    },
    async transform<L = unknown>(raw: { id: string }, pathname: string, method: Method): Promise<Context<{ id: string }, L>> {
      return {
        method,
        pathname,
        path: pathname,
        params: { id: raw.id },
        query: {},
        headers: {},
        body: undefined as L,
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
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      expect(registeredRoutes).toHaveLength(1);
      expect(registeredRoutes[0]?.method).toBe('GET');
      expect(registeredRoutes[0]?.pathname).toBe('/api/test');
    });

    it('should register multiple routes', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/users' as string]: async () => [],
        ['POST /api/users' as string]: async () => ({ id: 1 }),
        ['GET /api/users/:id' as string]: async () => ({ id: 1 }),
      });

      expect(registeredRoutes).toHaveLength(3);
    });

    it('should not re-register existing route on hot update', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

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
      const tunnel = new Tunnel(adapter);

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
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      expect(registeredRoutes).toHaveLength(1);

      const proxy = registeredRoutes[0]?.proxy;
      expect(proxy).toBeDefined();

      tunnel.unregister('GET /api/test');

      await expect(proxy!({ id: '123' })).rejects.toThrow('[Tunnel] Route Not Found');
    });

    it('should call adapter.unregister', async () => {
      const { adapter } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      tunnel.unregister('GET /api/test');

      expect(tunnel.has('GET /api/test')).toBe(false);
    });
  });

  describe('proxy', () => {
    it('should throw error for unregistered route', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/other' as string]: async () => ({ hello: 'world' }),
      });

      const proxy = registeredRoutes[0]?.proxy;
      expect(proxy).toBeDefined();
      await expect(proxy!({ id: '123' })).resolves.toEqual({ hello: 'world' });
    });
  });
});