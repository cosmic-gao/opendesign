export type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string | string[]>;
};

export class Response {
  public readonly status: number;
  public readonly statusText: string;
  public readonly headers: Record<string, string | string[]>;
  public readonly body: unknown;

  public constructor(body: unknown, init: ResponseInit = {}) {
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? defaultStatusText(this.status);
    this.headers = { ...init.headers };
    this.body = body;
  }
}

function defaultStatusText(status: number): string {
  switch (status) {
    case 200:
      return 'OK';
    case 201:
      return 'Created';
    case 204:
      return 'No Content';
    case 301:
      return 'Moved Permanently';
    case 302:
      return 'Found';
    case 304:
      return 'Not Modified';
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Unknown';
  }
}

export function redirect(location: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: location },
  });
}
