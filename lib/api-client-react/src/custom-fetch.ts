export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

let _baseUrl: string | null = null;
let _authTokenGetter: AuthTokenGetter | null = null;

/**
 * Set a base URL that is prepended to every relative request URL
 * (i.e. paths that start with `/`).
 *
 * Useful for Expo bundles that need to call a remote API server.
 * Pass `null` to clear the base URL.
 */
export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : null;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

function getFirebaseContext() {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");
  return { auth, db, userId: user.uid };
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const urlStr = typeof input === "string" ? input : (isUrl(input) ? input.toString() : input.url);
  const method = resolveMethod(input, options.method);
  
  // Auth endpoints are now handled by SDK directly in Auth.jsx, 
  // but we keep these as pass-throughs or legacy support if needed.
  if (urlStr.includes('/api/auth/')) {
    return {} as any; 
  }

  const { db, userId } = getFirebaseContext();

  if (urlStr.includes('/api/collections')) {
    const colRef = collection(db, "users", userId, "collections");
    
    if (method === 'GET') {
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
    }
    
    if (method === 'POST') {
      const body = JSON.parse(options.body as string);
      const docRef = await addDoc(colRef, { 
        ...body, 
        created_at: new Date().toISOString() 
      });
      return { id: docRef.id, ...body } as any;
    }
  }

  if (urlStr.includes('/api/resources')) {
    const resRef = collection(db, "users", userId, "resources");
    const matchId = urlStr.match(/\/api\/resources\/([^\/\?]+)/);
    const rId = matchId ? matchId[1] : null;

    if (method === 'GET') {
      let q = query(resRef);
      // Basic filtering support
      try {
        const u = new URL(urlStr, 'http://localhost');
        const rType = u.searchParams.get('type');
        const cId = u.searchParams.get('collectionId');
        
        if (rType && rType !== 'undefined') q = query(q, where("type", "==", rType));
        if (cId && cId !== 'undefined') q = query(q, where("collectionId", "==", cId));
      } catch (e) {}

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Post-filtering for search and tags which Firestore handles poorly with simple queries
      try {
        const u = new URL(urlStr, 'http://localhost');
        const tags = u.searchParams.get('tags');
        const search = u.searchParams.get('search');
        if (tags && tags !== 'undefined') {
          results = results.filter((r: any) => r.tags?.toLowerCase().includes(tags.toLowerCase()));
        }
        if (search && search !== 'undefined') {
          results = results.filter((r: any) => r.title?.toLowerCase().includes(search.toLowerCase()));
        }
      } catch (e) {}

      return results as any;
    }
    
    if (method === 'POST') {
      const body = JSON.parse(options.body as string);
      const docRef = await addDoc(resRef, { 
        pinned: false, 
        status: 'Not Started', 
        priority: 'Medium', 
        ...body,
        created_at: serverTimestamp()
      });
      return { id: docRef.id, ...body } as any;
    }

    if (rId && method === 'PATCH') {
      const docRef = doc(db, "users", userId, "resources", rId);
      if (urlStr.endsWith('/pin')) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentPinned = docSnap.data().pinned;
          await updateDoc(docRef, { pinned: !currentPinned });
          return { id: rId, ...docSnap.data(), pinned: !currentPinned } as any;
        }
      } else {
        const body = JSON.parse(options.body as string);
        await updateDoc(docRef, body);
        const docSnap = await getDoc(docRef);
        return { id: rId, ...docSnap.data() } as any;
      }
    }

    if (rId && method === 'DELETE') {
      await deleteDoc(doc(db, "users", userId, "resources", rId));
      return { success: true } as any;
    }
  }

  if (urlStr.includes('/api/stats/summary')) {
    const resRef = collection(db, "users", userId, "resources");
    const snapshot = await getDocs(resRef);
    const resources = snapshot.docs.map(d => d.data());
    
    const total = resources.length;
    const pinned = resources.filter((r: any) => r.pinned).length;
    const byType = resources.reduce((acc: any, r: any) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, pinned, byType } as any;
  }

  if (urlStr.includes('/api/stats/tags')) {
    const resRef = collection(db, "users", userId, "resources");
    const snapshot = await getDocs(resRef);
    const resources = snapshot.docs.map(d => d.data());
    
    const tagCounts: Record<string, number> = {};
    resources.forEach((r: any) => {
      if (r.tags) {
        const tgs = r.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        tgs.forEach((t: string) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });
    const tagArray = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
    tagArray.sort((a, b) => b.count - a.count);
    return tagArray as any;
  }

  return [] as any; 
}



