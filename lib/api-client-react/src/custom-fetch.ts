export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T> = T;
export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;

  const url = resolveUrl(input);
  if (!url.startsWith("/")) return input;

  const full = `${_baseUrl}${url}`;

  if (typeof input === "string") return full;
  if (isUrl(input)) return new URL(full);
  
  // Clean fallback mapping to prevent double-wrapping native request references
  return full;
}

function resolveMethod(input: RequestInfo | URL, method?: string) {
  if (method) return method.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>) {
  const headers = new Headers();
  for (const s of sources) {
    if (!s) continue;
    new Headers(s).forEach((v, k) => headers.set(k, v));
  }
  return headers;
}

function getMediaType(headers: Headers) {
  const v = headers.get("content-type");
  return v ? v.split(";")[0].trim().toLowerCase() : null;
}

function isJson(media: string | null) {
  return media === "application/json" || media?.endsWith("+json");
}

function hasNoBody(res: Response, method: string) {
  return (
    method === "HEAD" ||
    NO_BODY_STATUS.has(res.status) ||
    res.headers.get("content-length") === "0"
  );
}

export class ApiError<T = unknown> extends Error {
  status: number;
  data: T | null;

  constructor(res: Response, data: T | null, info: any) {
    super(`HTTP ${res.status} ${res.statusText}`);
    this.status = res.status;
    this.data = data;
  }
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {}
): Promise<T> {
  // 1. SAFETYS: Check for raw "undefined" or broken string parameters early
  if (!input || input === "undefined" || resolveUrl(input).includes("/undefined/")) {
    console.trace("🔍 Broken URL origin — trace to find the call site:"); // <-- CHANGED
    return null as T;
  }

  input = applyBaseUrl(input);

  const { responseType = "auto", headers: h, ...init } = options;
  const method = resolveMethod(input, init.method);

  const headers = mergeHeaders(
    isRequest(input) ? input.headers : undefined,
    h
  );

  if (typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (!headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  let token: string | null = null;

  if (_authTokenGetter) {
    token = await _authTokenGetter();
  } else if (typeof window !== "undefined") {
    token = localStorage.getItem("taskflow_token");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  // 2. SAFE EXECUTION: Clean conversion if input is an object instead of string
  const finalTarget = isRequest(input) ? input.url : input;

  const response = await fetch(finalTarget, {
    ...init,
    method,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response, text as any, { method });
  }

  if (hasNoBody(response, method)) return null as T;

  const media = getMediaType(response.headers);

  if (responseType === "json" || isJson(media)) {
    return response.json();
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  return response.json();
}