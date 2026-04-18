import type { ContentType } from './mime';
import type { ResponseHeadersInit, StatusCode } from './types';

/** JSON 值的类型定义 */
type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
/** 可作为请求体的数据类型 */
type BodyData = string | ArrayBuffer | ReadableStream | Uint8Array;
/** Web Response 支持的请求体类型 */
type BodyInit = string | ArrayBuffer | Blob | FormData | URLSearchParams | ReadableStream | null;

/**
 * 从响应初始化参数获取 Headers 对象
 * @param init - 响应头初始化参数
 * @returns Headers 对象
 */
function getHeaders(init?: ResponseHeadersInit | StatusCode): Headers {
  if (!init) return new Headers();

  if (init instanceof Headers) {
    return init;
  }

  const headers = new Headers();

  if (Array.isArray(init)) {
    for (const [key, value] of init) {
      headers.set(key, value);
    }
    return headers;
  }

  for (const [key, value] of Object.entries(init)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

/**
 * 从初始化参数获取状态码和 Headers
 * @param init - 响应初始化参数
 * @returns 包含 status 和 headers 的对象
 */
function getStatusAndHeaders(
  init?: ResponseHeadersInit | StatusCode
): { status: number; headers: Headers } {
  if (typeof init === 'number') {
    return { status: init, headers: new Headers() };
  }
  if (init instanceof Headers) {
    return { status: 200, headers: init };
  }
  if (Array.isArray(init)) {
    return { status: 200, headers: getHeaders(init) };
  }
  return { status: 200, headers: getHeaders(init) };
}

/**
 * 创建 JSON 响应
 * @template T - JSON 数据类型
 * @param data - 要序列化的数据
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function json<T extends JSONValue>(data: T, init?: ResponseHeadersInit | StatusCode): Response;
export function json<T extends JSONValue, U extends StatusCode>(data: T, status: U, headers?: ResponseHeadersInit): Response;
export function json<T extends JSONValue>(
  data: T,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  if (!h.has('Content-Type')) {
    h.set('Content-Type', 'application/json');
  }
  return new Response(JSON.stringify(data), { status, headers: h });
}

/**
 * 创建 HTML 响应
 * @template T - HTML 字符串类型
 * @param html - HTML 内容
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function html<T extends string>(html: T, init?: ResponseHeadersInit | StatusCode): Response;
export function html<T extends string, U extends StatusCode>(html: T, status: U, headers?: ResponseHeadersInit): Response;
export function html<T extends string>(
  html: T,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  if (!h.has('Content-Type')) {
    h.set('Content-Type', 'text/html');
  }
  return new Response(html, { status, headers: h });
}

/**
 * 创建纯文本响应
 * @template T - 文本类型
 * @param text - 文本内容
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function text<T extends string>(text: T, init?: ResponseHeadersInit | StatusCode): Response;
export function text<T extends string, U extends StatusCode>(text: T, status: U, headers?: ResponseHeadersInit): Response;
export function text<T extends string>(
  text: T,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  if (!h.has('Content-Type')) {
    h.set('Content-Type', 'text/plain');
  }
  return new Response(text, { status, headers: h });
}

/**
 * 创建 XML 响应
 * @template T - XML 字符串类型
 * @param xml - XML 内容
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function xml<T extends string>(xml: T, init?: ResponseHeadersInit | StatusCode): Response;
export function xml<T extends string, U extends StatusCode>(xml: T, status: U, headers?: ResponseHeadersInit): Response;
export function xml<T extends string>(
  xml: T,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  if (!h.has('Content-Type')) {
    h.set('Content-Type', 'application/xml');
  }
  return new Response(xml, { status, headers: h });
}

/**
 * 创建自定义内容类型的响应
 * @template T - Body 数据类型
 * @param data - 数据内容
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function body<T extends BodyData>(data: T, init?: ResponseHeadersInit | StatusCode): Response;
export function body<T extends BodyData, U extends StatusCode>(data: T, status: U, headers?: ResponseHeadersInit): Response;
export function body<T extends BodyData>(
  data: T,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  return new Response(data as unknown as BodyInit, { status, headers: h });
}

/**
 * 创建 404 Not Found 响应
 * @param message - 可选的错误消息
 * @returns Response 对象
 */
export function notFound(message?: string): Response {
  return new Response(message ?? 'Not Found', { status: 404 });
}

/**
 * 创建重定向响应
 * @param location - 重定向目标 URL
 * @param status - HTTP 状态码，默认 302
 * @returns Response 对象
 */
export function redirect(location: string, status: StatusCode = 302): Response {
  const headers = new Headers();
  headers.set('Location', location);
  return new Response(null, { status, headers });
}

/**
 * 创建 Blob 响应
 * @template T - Body 数据类型
 * @param data - 二进制数据
 * @param contentType - 内容类型
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function blob<T extends BodyData>(data: T, contentType?: ContentType, init?: ResponseHeadersInit | StatusCode): Response;
export function blob<T extends BodyData, U extends StatusCode>(data: T, contentType: ContentType | undefined, status: U, headers?: ResponseHeadersInit): Response;
export function blob<T extends BodyData>(
  data: T,
  contentType?: ContentType,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  if (contentType && !h.has('Content-Type')) {
    h.set('Content-Type', contentType);
  }
  return new Response(data as unknown as BodyInit, { status, headers: h });
}

/**
 * 创建 ArrayBuffer 响应
 * @template T - ArrayBuffer 或 ArrayBufferView 类型
 * @param data - 缓冲区数据
 * @param contentType - 内容类型
 * @param initOrStatus - 可选的响应初始化对象或状态码
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function arrayBuffer<T extends ArrayBuffer | ArrayBufferView | BodyData>(data: T, contentType?: ContentType, init?: ResponseHeadersInit | StatusCode): Response;
export function arrayBuffer<T extends ArrayBuffer | ArrayBufferView | BodyData, U extends StatusCode>(data: T, contentType: ContentType | undefined, status: U, headers?: ResponseHeadersInit): Response;
export function arrayBuffer<T extends ArrayBuffer | ArrayBufferView | BodyData>(
  data: T,
  contentType?: ContentType,
  initOrStatus?: ResponseHeadersInit | StatusCode,
  headers?: ResponseHeadersInit
): Response {
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof initOrStatus === 'number') {
    status = initOrStatus;
    h = getHeaders(headers);
  } else {
    h = getHeaders(initOrStatus);
  }

  if (contentType && !h.has('Content-Type')) {
    h.set('Content-Type', contentType);
  }
  return new Response(data as unknown as BodyInit, { status, headers: h });
}

/**
 * 创建流式响应
 * @template T - ReadableStream 类型
 * @param readable - 可读流
 * @param contentTypeOrInit - 内容类型或响应初始化对象
 * @param statusOrHeaders - 状态码或响应头
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function stream<T extends ReadableStream>(
  readable: T,
  contentTypeOrInit?: ContentType | ResponseHeadersInit | StatusCode,
  statusOrHeaders?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response {
  let contentType: ContentType | undefined;
  let status: StatusCode = 200;
  let h: Headers;

  if (typeof contentTypeOrInit === 'string') {
    contentType = contentTypeOrInit;
    const result = getStatusAndHeaders(statusOrHeaders as ResponseHeadersInit | StatusCode);
    status = result.status;
    h = result.headers;
  } else {
    const result = getStatusAndHeaders(contentTypeOrInit as ResponseHeadersInit | StatusCode);
    status = result.status;
    h = result.headers;
  }

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      h.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  if (contentType && !h.has('Content-Type')) {
    h.set('Content-Type', contentType);
  }

  return new Response(readable, { status, headers: h });
}

/**
 * 创建文本流响应
 * @template T - 文本类型
 * @param text - 要发送的文本
 * @param contentTypeOrInit - 内容类型或响应初始化对象
 * @param statusOrHeaders - 状态码或响应头
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function streamText<T extends string>(
  text: T,
  contentTypeOrInit?: ContentType | ResponseHeadersInit | StatusCode,
  statusOrHeaders?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response {
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

  return stream(readable, contentTypeOrInit ?? 'text/plain', statusOrHeaders as StatusCode | ResponseHeadersInit, headers);
}

/**
 * 创建 Server-Sent Events (SSE) 流响应
 * @template T - 异步可迭代对象类型
 * @param source - 异步数据源
 * @param statusOrInit - 可选的响应初始化对象
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function streamSSE<T extends AsyncIterable<unknown>>(
  source: T,
  statusOrInit?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response {
  const { status, headers: h } = getStatusAndHeaders(statusOrInit);

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        for (const v of value) h.append(key, v);
      } else {
        h.set(key, value);
      }
    }
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of source) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      } catch {
        // 忽略写入过程中的错误（例如客户端提前断开连接）
      } finally {
        try {
          controller.close();
        } catch {
          // 忽略关闭错误（如果控制器已关闭或处于错误状态）
        }
      }
    },
  });

  const responseHeaders = h;
  if (!responseHeaders.has('Content-Type')) {
    responseHeaders.set('Content-Type', 'text/event-stream');
  }
  responseHeaders.set('Cache-Control', 'no-cache');
  responseHeaders.set('Connection', 'keep-alive');

  return new Response(readable, { status, headers: responseHeaders });
}

/**
 * 创建 WebSocket 升级响应
 * @param statusOrInit - 可选的响应初始化对象
 * @param headers - 可选的响应头
 * @returns Response 对象
 */
export function upgradeWebSocket(
  statusOrInit?: StatusCode | ResponseHeadersInit,
  headers?: ResponseHeadersInit
): Response {
  const { status, headers: h } = getStatusAndHeaders(statusOrInit);

  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      h.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  return new Response(null, { status, headers: h });
}
