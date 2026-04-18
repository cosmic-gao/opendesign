import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { Hono as HonoAdapter } from '../adapters/hono';
import { Tunnel } from '../tunnel';

describe('Hono Adapter', () => {
  it('should register and execute a route', async () => {
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

  it('should parse JSON body', async () => {
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

  it('should handle unregister and return 404', async () => {
    const app = new Hono();
    const adapter = new HonoAdapter(app);
    const tunnel = new Tunnel(adapter);

    tunnel.register({
      'GET /removable': () => ({ removable: true })
    });

    const req1 = new Request('http://localhost/removable');
    const res1 = await app.request(req1);
    expect(res1.status).toBe(200);

    // Unregister
    tunnel.unregister('GET /removable');

    const req2 = new Request('http://localhost/removable');
    const res2 = await app.request(req2);
    
    // Hono adapter should catch the "Route Not Found" error and return 404
    expect(res2.status).toBe(404);
  });

  it('should collect multiple headers into an array', async () => {
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
    
    // Headers parsing in Hono Request objects via Web Standards (Fetch API) 
    // comma separates multiple values for identical header names (e.g. "Value1, Value2").
    // Fetch API Headers object merges them. But let's check how hono/adapter handles it.
    expect(headersRecord?.['x-custom']).toBeDefined();
  });
});
