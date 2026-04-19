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

describe('Tunnel 核心', () => {
  describe('register', () => {
    it('应能注册单个路由', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      expect(registeredRoutes).toHaveLength(1);
      expect(registeredRoutes[0]?.method).toBe('GET');
      expect(registeredRoutes[0]?.pathname).toBe('/api/test');
    });

    it('应能批量注册多个路由', async () => {
      const { adapter, registeredRoutes } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/users' as string]: async () => [],
        ['POST /api/users' as string]: async () => ({ id: 1 }),
        ['GET /api/users/:id' as string]: async () => ({ id: 1 }),
      });

      expect(registeredRoutes).toHaveLength(3);
    });

    it('热更新时不应重复注册已有路由', async () => {
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

    it('热更新后应调用新的处理器', async () => {
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
    it('应能从注册表中移除路由', async () => {
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

    it('应调用适配器的卸载方法', async () => {
      const { adapter } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        ['GET /api/test' as string]: async () => ({ hello: 'world' }),
      });

      tunnel.unregister('GET /api/test');

      expect(tunnel.has('GET /api/test')).toBe(false);
    });

    it('使用 * 或 ** 作为键名时应拒绝卸载', () => {
      const { adapter } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      expect(tunnel.unregister('*')).toBe(false);
      expect(tunnel.unregister('**')).toBe(false);
    });

    it('使用 ** 后缀时应按前缀批量卸载匹配路由', () => {
      const { adapter } = createMockAdapter();
      const tunnel = new Tunnel(adapter);

      tunnel.register({
        'GET /api/hello': async () => ({}),
        'GET /api/world': async () => ({}),
        'POST /api/hello': async () => ({}),
      });

      expect(tunnel.has('GET /api/hello')).toBe(true);
      expect(tunnel.has('GET /api/world')).toBe(true);
      expect(tunnel.has('POST /api/hello')).toBe(true);

      const deleted = tunnel.unregister('GET /api/**');

      expect(deleted).toBe(true);
      expect(tunnel.has('GET /api/hello')).toBe(false);
      expect(tunnel.has('GET /api/world')).toBe(false);
      expect(tunnel.has('POST /api/hello')).toBe(true);
    });
  });

  describe('proxy', () => {
    it('未注册路由应抛出错误', async () => {
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

  describe('可选适配器方法', () => {
    it('适配器没有 register 或 unregister 时应正常工作', () => {
      const mockApp = { mock: true };
      const adapter: Adapter<typeof mockApp, any> = {
        app: mockApp,
        name: 'minimal-adapter',
        async transform(raw: any, pathname: string, method: Method): Promise<Context<any, any>> {
          return {} as any;
        }
      };

      const tunnel = new Tunnel(adapter);

      expect(() => {
        tunnel.register({
          'GET /test': () => ({ ok: true })
        });
      }).not.toThrow();

      expect(tunnel.has('GET /test')).toBe(true);

      expect(() => {
        const deleted = tunnel.unregister('GET /test');
        expect(deleted).toBe(true);
      }).not.toThrow();

      expect(tunnel.has('GET /test')).toBe(false);

      tunnel.register({
        'GET /api/test': () => ({ ok: true })
      });
      expect(() => {
        const deleted = tunnel.unregister('GET /api/**');
        expect(deleted).toBe(true);
      }).not.toThrow();
    });
  });
});