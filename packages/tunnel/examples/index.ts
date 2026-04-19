import { serve } from '@hono/node-server';
import { Tunnel, json, html, text, xml, notFound, redirect, Hono } from '..';

const adapter = new Hono();
const tunnel = new Tunnel(adapter);

// ============================================
// 路由参数（Path Parameters）
// 访问: GET /api/users/123
// ============================================
tunnel.register({
    // 路径参数通过 :paramName 的形式定义
    'GET /api/users/:id': (ctx) => {
        return json({
            type: 'path-param',
            userId: ctx.params.id ?? '',
            message: `获取用户 ${ctx.params.id} 的信息`
        });
    },
});

// ============================================
// 查询参数（Query Parameters）
// 访问: GET /api/search?q=keyword&page=1&filter=active
// ============================================
tunnel.register({
    'GET /api/search': (ctx) => {
        const q = ctx.query.q as string;
        const page = Number(ctx.query.page) || 1;
        const filter = ctx.query.filter as string;

        return json({
            type: 'query-params',
            query: q,
            page: page,
            filter: filter,
            results: [
                { id: 1, title: `关于 "${q}" 的结果 1` },
                { id: 2, title: `关于 "${q}" 的结果 2` },
            ]
        });
    },
});

// ============================================
// 多个路径参数
// 访问: GET /api/orgs/1/repos/2
// ============================================
tunnel.register({
    'GET /api/orgs/:orgId/repos/:repoId': (ctx) => {
        return json({
            type: 'multiple-path-params',
            orgId: ctx.params.orgId ?? '',
            repoId: ctx.params.repoId ?? '',
            fullPath: `${ctx.params.orgId}/${ctx.params.repoId}`
        });
    },
});

// ============================================
// 请求头（Headers）
// 访问: GET /api/headers
// 需要携带: Authorization: Bearer token123, X-Request-ID: abc
// ============================================
tunnel.register({
    'GET /api/headers': (ctx) => {
        const auth = ctx.headers['authorization'] as string;
        const requestId = ctx.headers['x-request-id'] as string;
        const contentType = ctx.headers['content-type'] as string;

        return json({
            type: 'headers',
            authorization: auth,
            'x-request-id': requestId,
            'content-type': contentType,
            isAuthenticated: !!auth
        });
    },
});

// ============================================
// POST JSON Body
// 访问: POST /api/users
// Body: { "name": "张三", "email": "zhangsan@example.com", "age": 25 }
// ============================================
tunnel.register({
    'POST /api/users': (ctx) => {
        const body = ctx.body as { name: string; email: string; age?: number };
        return json({
            type: 'json-body',
            received: body,
            id: Math.floor(Math.random() * 10000),
            created: true
        }, 201);
    },
});

// ============================================
// POST Form Data (application/x-www-form-urlencoded)
// 访问: POST /api/submit-form
// Body: name=李四&message=这是表单提交
// ============================================
tunnel.register({
    'POST /api/submit-form': (ctx) => {
        const body = ctx.body as string;
        return json({
            type: 'form-data',
            received: body,
            message: '表单提交成功'
        });
    },
});

// ============================================
// POST Multipart Form Data
// 访问: POST /api/upload
// Body: FormData with fields: title, file
// ============================================
tunnel.register({
    'POST /api/upload': (ctx) => {
        const body = ctx.body as FormData;
        return json({
            type: 'multipart-form',
            hasFormData: body instanceof FormData,
            message: '文件上传成功（演示）'
        });
    },
});

// ============================================
// PUT 更新资源（带 JSON Body）
// 访问: PUT /api/users/456
// Body: { "name": "王五", "email": "wangwu@example.com" }
// ============================================
tunnel.register({
    'PUT /api/users/:id': (ctx) => {
        const body = ctx.body as { name: string; email: string };
        return json({
            type: 'put-request',
            userId: ctx.params.id ?? '',
            updated: body,
            success: true
        });
    },
});

// ============================================
// PATCH 部分更新
// 访问: PATCH /api/users/456
// Body: { "name": "赵六" }
// ============================================
tunnel.register({
    'PATCH /api/users/:id': (ctx) => {
        const body = ctx.body as { name?: string; email?: string };
        return json({
            type: 'patch-request',
            userId: ctx.params.id ?? '',
            partialUpdate: body,
            success: true
        });
    },
});

// ============================================
// DELETE 删除资源
// 访问: DELETE /api/users/456
// ============================================
tunnel.register({
    'DELETE /api/users/:id': (ctx) => {
        return json({
            type: 'delete-request',
            userId: ctx.params.id ?? '',
            deleted: true
        });
    },
});

// ============================================
// 同路径多方法
// 访问: GET /api/resource, POST /api/resource
// ============================================
tunnel.register({
    'GET /api/resource': (ctx) => {
        return json({
            type: 'same-path-get',
            data: ['资源A', '资源B', '资源C']
        });
    },
    'POST /api/resource': (ctx) => {
        const body = ctx.body as { name?: string };
        return json({
            type: 'same-path-post',
            received: body,
            created: true
        }, 201);
    },
});

// ============================================
// 响应示例
// ============================================
tunnel.register({
    // 普通 JSON 响应
    'GET /api/json': () => json({ a: 1, b: 2 }),
    // 带状态码和响应头
    'GET /api/json-custom': () => json({ message: 'created' }, 201, { 'X-Custom': 'header' }),
    // HTML 响应
    'GET /api/html': () => html('<h1>Hello Tunnel</h1><p>这是 HTML 响应</p>'),
    // XML 响应
    'GET /api/xml': () => xml('<?xml version="1.0"?><root><item>XML数据</item></root>'),
    // 纯文本响应
    'GET /api/text': () => text('这是一条纯文本响应'),
    // 重定向
    'GET /api/redirect': () => redirect('/api/json', 301),
    // 404 Not Found
    'GET /api/not-found': () => notFound('Resource not found'),
    // 通配符路径参数
    'GET /api/wildcard/**': (ctx) => {
        return json({
            type: 'wildcard',
            path: ctx.path,
            params: ctx.params as Record<string, string>
        });
    },
});

// ============================================
// 信息汇总接口
// ============================================
tunnel.register({
    'GET /api/info': (ctx) => {
        return json({
            message: 'Tunnel 路由系统演示',
            endpoints: [
                'GET  /api/users/:id           - 路径参数',
                'GET  /api/search?q=&page=    - 查询参数',
                'GET  /api/orgs/:orgId/repos/:repoId - 多路径参数',
                'GET  /api/headers            - 请求头',
                'POST /api/users             - JSON Body',
                'POST /api/submit-form       - Form Data',
                'POST /api/upload            - Multipart Form',
                'PUT  /api/users/:id         - PUT 更新',
                'PATCH /api/users/:id        - PATCH 部分更新',
                'DELETE /api/users/:id       - DELETE 删除',
                'GET  /api/resource          - 同路径多方法 (GET)',
                'POST /api/resource          - 同路径多方法 (POST)',
            ],
            howToTest: '使用 curl 或 Postman 访问上述端点',
            example: 'curl http://localhost:3000/api/users/123'
        });
    },
});

serve({
    fetch: adapter.app.fetch,
    port: 3000
});
console.log('Server running on http://localhost:3000');
console.log('访问 http://localhost:3000/api/info 查看所有可用端点');