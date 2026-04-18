import type { ContentType } from './mime';
import type { ResponseHeadersInit, StatusCode } from './types';

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
type BodyData = string | ArrayBuffer | ReadableStream | Uint8Array;
type BodyInit = string | ArrayBuffer | Blob | FormData | URLSearchParams | ReadableStream | null;

function getHeaders(init?: ResponseHeadersInit | StatusCode): Headers {
  const headers = new Headers();
  if (!init) return headers;

  if (init instanceof Headers) {
    for (const [key, value] of init.entries()) {
      headers.set(key, value);
    }
    return headers;
  }

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

// ========== JSON ==========
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

// ========== HTML ==========
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

// ========== TEXT ==========
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

// ========== XML ==========
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

// ========== BODY ==========
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

// ========== NOT_FOUND ==========
export function notFound(message?: string): Response {
  return new Response(message ?? 'Not Found', { status: 404 });
}

// ========== REDIRECT ==========
export function redirect(location: string, status: StatusCode = 302): Response {
  const headers = new Headers();
  headers.set('Location', location);
  return new Response(null, { status, headers });
}

// ========== BLOB ==========
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

// ========== ARRAY_BUFFER ==========
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

// ========== STREAM ==========
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

// ========== STREAM_TEXT ==========
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

// ========== STREAM_SSE ==========
export function streamSSE<T extends AsyncIterable<any>>(
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
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
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

// ========== UPGRADE_WEBSOCKET ==========
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

export { MIME_TYPES } from './mime';
export type { ContentType } from './mime';