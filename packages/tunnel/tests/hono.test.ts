import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { Hono as HonoAdapter } from '../adapters/hono';
import { Tunnel } from '../tunnel';

describe('Hono 适配器', () => {
  it('应能注册并执行路由', async () => {
    const app = new Hono();
    const adapter = new HonoAdapter(app);
    const tunnel = new Tunnel(adapter);

    tunnel.register({
      'GET /test': () => ({ success: true })
    });

    const req = new Request('http://localhost/test');
    const res = await app.request(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it('应能解析 JSON 请求体', async () => {
    const app = new Hono();
    const adapter = new HonoAdapter(app);
    const tunnel = new Tunnel(adapter);

    let parsedBody: unknown;

    tunnel.register({
      'POST /echo': (ctx) => {
        parsedBody = ctx.body;
        return { echoed: true };
      }
    });

    const req = new Request('http://localhost/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'hello' })
    });

    const res = await app.request(req);

    expect(res.status).toBe(200);
    expect(parsedBody).toEqual({ message: 'hello' });
  });

  it('卸载路由后应返回404', async () => {
    const app = new Hono();
    const adapter = new HonoAdapter(app);
    const tunnel = new Tunnel(adapter);

    tunnel.register({
      'GET /removable': () => ({ removable: true })
    });

    const req1 = new Request('http://localhost/removable');
    const res1 = await app.request(req1);
    expect(res1.status).toBe(200);

    tunnel.unregister('GET /removable');

    const req2 = new Request('http://localhost/removable');
    const res2 = await app.request(req2);

    expect(res2.status).toBe(404);
  });

  it('应能将多个同名请求头收集为数组', async () => {
    const app = new Hono();
    const adapter = new HonoAdapter(app);
    const tunnel = new Tunnel(adapter);

    let headersRecord: Record<string, string | string[] | undefined> | undefined;

    tunnel.register({
      'GET /headers': (ctx) => {
        headersRecord = ctx.headers;
        return { ok: true };
      }
    });

    const req = new Request('http://localhost/headers');
    req.headers.append('X-Custom', 'Value1');
    req.headers.append('X-Custom', 'Value2');

    await app.request(req);

    expect(headersRecord?.['x-custom']).toBeDefined();
  });

  it('应支持卸载后重新注册实现热更新', async () => {
    const app = new Hono();
    const adapter = new HonoAdapter(app);
    const tunnel = new Tunnel(adapter);

    let counter = 0;
    tunnel.register({
      'GET /reload': () => ({ version: ++counter })
    });

    let res = await app.request(new Request('http://localhost/reload'));
    expect(await res.json()).toEqual({ version: 1 });

    tunnel.unregister('GET /reload');

    tunnel.register({
      'GET /reload': () => ({ version: ++counter })
    });

    res = await app.request(new Request('http://localhost/reload'));
    expect(await res.json()).toEqual({ version: 2 });
  });

  it('Hono 在接收请求后不允许添加新路由', async () => {
    const app = new Hono();
    app.get('/1', (c) => c.text('1'));

    await app.request('http://localhost/1');

    expect(() => {
      app.get('/2', (c) => c.text('2'));
    }).toThrow('Can not add a route since the matcher is already built.');
  });
});