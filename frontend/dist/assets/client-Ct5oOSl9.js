const Local = "http://localhost:4000";
function Environment(name) {
  return `https://${name}-.encr.app`;
}
function PreviewEnv(pr) {
  return Environment(`pr${pr}`);
}
const BROWSER = typeof globalThis === "object" && "window" in globalThis;
class Client {
  /**
   * Creates a Client for calling the public and authenticated APIs of your Encore application.
   *
   * @param target  The target which the client should be configured to use. See Local and Environment for options.
   * @param options Options for the client
   */
  constructor(target, options) {
    this.target = target;
    this.options = options ?? {};
    const base = new BaseClient(this.target, this.options);
    this.analytics = new analytics.ServiceClient(base);
    this.auth = new auth.ServiceClient(base);
    this.health = new health.ServiceClient(base);
    this.metadata = new metadata.ServiceClient(base);
  }
  /**
   * Creates a new Encore client with the given client options set.
   *
   * @param options Client options to set. They are merged with existing options.
   **/
  with(options) {
    return new Client(this.target, {
      ...this.options,
      ...options
    });
  }
}
var analytics;
((analytics2) => {
  class ServiceClient {
    constructor(baseClient) {
      this.baseClient = baseClient;
      this.getStats = this.getStats.bind(this);
      this.trackEvent = this.trackEvent.bind(this);
    }
    /**
     * Retrieves anonymous usage statistics for the application.
     */
    async getStats(params) {
      const query = makeRecord({
        days: params.days === void 0 ? void 0 : String(params.days)
      });
      const resp = await this.baseClient.callTypedAPI(`/analytics/stats`, { query, method: "GET", body: void 0 });
      return JSON.parse(await resp.text(), dateReviver);
    }
    /**
     * Tracks an analytics event for privacy-respecting usage insights.
     */
    async trackEvent(params) {
      const resp = await this.baseClient.callTypedAPI(`/analytics/events`, { method: "POST", body: JSON.stringify(params) });
      return JSON.parse(await resp.text(), dateReviver);
    }
  }
  analytics2.ServiceClient = ServiceClient;
})(analytics || (analytics = {}));
var auth;
((auth2) => {
  class ServiceClient {
    constructor(baseClient) {
      this.baseClient = baseClient;
      this.exchangeCode = this.exchangeCode.bind(this);
      this.getConfig = this.getConfig.bind(this);
      this.refreshToken = this.refreshToken.bind(this);
    }
    /**
     * Exchanges an authorization code for an access token.
     */
    async exchangeCode(params) {
      const resp = await this.baseClient.callTypedAPI(`/auth/google/exchange-code`, { method: "POST", body: JSON.stringify(params) });
      return JSON.parse(await resp.text(), dateReviver);
    }
    /**
     * Retrieves the public configuration for the auth service.
     */
    async getConfig() {
      const resp = await this.baseClient.callTypedAPI(`/auth/config`, { method: "GET", body: void 0 });
      return JSON.parse(await resp.text(), dateReviver);
    }
    /**
     * Refreshes an access token using a refresh token.
     */
    async refreshToken(params) {
      const resp = await this.baseClient.callTypedAPI(`/auth/google/refresh-token`, { method: "POST", body: JSON.stringify(params) });
      return JSON.parse(await resp.text(), dateReviver);
    }
  }
  auth2.ServiceClient = ServiceClient;
})(auth || (auth = {}));
var health;
((health2) => {
  class ServiceClient {
    constructor(baseClient) {
      this.baseClient = baseClient;
      this.check = this.check.bind(this);
    }
    /**
     * Returns the health status of the RecordLane backend services.
     */
    async check() {
      const resp = await this.baseClient.callTypedAPI(`/health`, { method: "GET", body: void 0 });
      return JSON.parse(await resp.text(), dateReviver);
    }
  }
  health2.ServiceClient = ServiceClient;
})(health || (health = {}));
var metadata;
((metadata2) => {
  class ServiceClient {
    constructor(baseClient) {
      this.baseClient = baseClient;
      this.create = this.create.bind(this);
      this.deleteRecording = this.deleteRecording.bind(this);
      this.get = this.get.bind(this);
      this.list = this.list.bind(this);
      this.update = this.update.bind(this);
    }
    /**
     * Creates a new recording metadata entry.
     */
    async create(params) {
      const resp = await this.baseClient.callTypedAPI(`/recordings`, { method: "POST", body: JSON.stringify(params) });
      return JSON.parse(await resp.text(), dateReviver);
    }
    /**
     * Deletes a recording metadata entry.
     */
    async deleteRecording(params) {
      await this.baseClient.callTypedAPI(`/recordings/${encodeURIComponent(params.id)}`, { method: "DELETE", body: void 0 });
    }
    /**
     * Retrieves a recording by its ID.
     */
    async get(params) {
      const resp = await this.baseClient.callTypedAPI(`/recordings/${encodeURIComponent(params.id)}`, { method: "GET", body: void 0 });
      return JSON.parse(await resp.text(), dateReviver);
    }
    /**
     * Retrieves all recordings, ordered by creation date (latest first).
     */
    async list(params) {
      const query = makeRecord({
        limit: params.limit === void 0 ? void 0 : String(params.limit),
        offset: params.offset === void 0 ? void 0 : String(params.offset),
        search: params.search
      });
      const resp = await this.baseClient.callTypedAPI(`/recordings`, { query, method: "GET", body: void 0 });
      return JSON.parse(await resp.text(), dateReviver);
    }
    /**
     * Updates a recording's metadata.
     */
    async update(params) {
      const body = {
        privacy: params.privacy,
        thumbnailUrl: params.thumbnailUrl,
        title: params.title
      };
      const resp = await this.baseClient.callTypedAPI(`/recordings/${encodeURIComponent(params.id)}`, { method: "PUT", body: JSON.stringify(body) });
      return JSON.parse(await resp.text(), dateReviver);
    }
  }
  metadata2.ServiceClient = ServiceClient;
})(metadata || (metadata = {}));
function dateReviver(key, value) {
  if (typeof value === "string" && value.length >= 10 && value.charCodeAt(0) >= 48 && // '0'
  value.charCodeAt(0) <= 57) {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return value;
}
function encodeQuery(parts) {
  const pairs = [];
  for (const key in parts) {
    const val = Array.isArray(parts[key]) ? parts[key] : [parts[key]];
    for (const v of val) {
      pairs.push(`${key}=${encodeURIComponent(v)}`);
    }
  }
  return pairs.join("&");
}
function makeRecord(record) {
  for (const key in record) {
    if (record[key] === void 0) {
      delete record[key];
    }
  }
  return record;
}
function encodeWebSocketHeaders(headers) {
  const base64encoded = btoa(JSON.stringify(headers)).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
  return "encore.dev.headers." + base64encoded;
}
class WebSocketConnection {
  constructor(url, headers) {
    this.hasUpdateHandlers = [];
    let protocols = ["encore-ws"];
    if (headers) {
      protocols.push(encodeWebSocketHeaders(headers));
    }
    this.ws = new WebSocket(url, protocols);
    this.on("error", () => {
      this.resolveHasUpdateHandlers();
    });
    this.on("close", () => {
      this.resolveHasUpdateHandlers();
    });
  }
  resolveHasUpdateHandlers() {
    const handlers = this.hasUpdateHandlers;
    this.hasUpdateHandlers = [];
    for (const handler of handlers) {
      handler();
    }
  }
  async hasUpdate() {
    await new Promise((resolve) => {
      this.hasUpdateHandlers.push(() => resolve(null));
    });
  }
  on(type, handler) {
    this.ws.addEventListener(type, handler);
  }
  off(type, handler) {
    this.ws.removeEventListener(type, handler);
  }
  close() {
    this.ws.close();
  }
}
class StreamInOut {
  constructor(url, headers) {
    this.buffer = [];
    this.socket = new WebSocketConnection(url, headers);
    this.socket.on("message", (event) => {
      this.buffer.push(JSON.parse(event.data, dateReviver));
      this.socket.resolveHasUpdateHandlers();
    });
  }
  close() {
    this.socket.close();
  }
  async send(msg) {
    if (this.socket.ws.readyState === WebSocket.CONNECTING) {
      await new Promise((resolve) => {
        this.socket.ws.addEventListener("open", resolve, { once: true });
      });
    }
    return this.socket.ws.send(JSON.stringify(msg));
  }
  async next() {
    for await (const next of this) return next;
    return void 0;
  }
  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.buffer.length > 0) {
        yield this.buffer.shift();
      } else {
        if (this.socket.ws.readyState === WebSocket.CLOSED) return;
        await this.socket.hasUpdate();
      }
    }
  }
}
class StreamIn {
  constructor(url, headers) {
    this.buffer = [];
    this.socket = new WebSocketConnection(url, headers);
    this.socket.on("message", (event) => {
      this.buffer.push(JSON.parse(event.data, dateReviver));
      this.socket.resolveHasUpdateHandlers();
    });
  }
  close() {
    this.socket.close();
  }
  async next() {
    for await (const next of this) return next;
    return void 0;
  }
  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.buffer.length > 0) {
        yield this.buffer.shift();
      } else {
        if (this.socket.ws.readyState === WebSocket.CLOSED) return;
        await this.socket.hasUpdate();
      }
    }
  }
}
class StreamOut {
  constructor(url, headers) {
    let responseResolver;
    this.responseValue = new Promise((resolve) => responseResolver = resolve);
    this.socket = new WebSocketConnection(url, headers);
    this.socket.on("message", (event) => {
      responseResolver(JSON.parse(event.data, dateReviver));
    });
  }
  async response() {
    return this.responseValue;
  }
  close() {
    this.socket.close();
  }
  async send(msg) {
    if (this.socket.ws.readyState === WebSocket.CONNECTING) {
      await new Promise((resolve) => {
        this.socket.ws.addEventListener("open", resolve, { once: true });
      });
    }
    return this.socket.ws.send(JSON.stringify(msg));
  }
}
const boundFetch = fetch.bind(void 0);
class BaseClient {
  constructor(baseURL, options) {
    this.baseURL = baseURL;
    this.headers = {};
    if (!BROWSER) {
      this.headers["User-Agent"] = "-Generated-TS-Client (Encore/1.49.3)";
    }
    this.requestInit = options.requestInit ?? {};
    if (options.fetcher !== void 0) {
      this.fetcher = options.fetcher;
    } else {
      this.fetcher = boundFetch;
    }
  }
  async getAuthData() {
    return void 0;
  }
  // createStreamInOut sets up a stream to a streaming API endpoint.
  async createStreamInOut(path, params) {
    let { query, headers } = params ?? {};
    const authData = await this.getAuthData();
    if (authData) {
      if (authData.query) {
        query = { ...query, ...authData.query };
      }
      if (authData.headers) {
        headers = { ...headers, ...authData.headers };
      }
    }
    const queryString = query ? "?" + encodeQuery(query) : "";
    return new StreamInOut(this.baseURL + path + queryString, headers);
  }
  // createStreamIn sets up a stream to a streaming API endpoint.
  async createStreamIn(path, params) {
    let { query, headers } = params ?? {};
    const authData = await this.getAuthData();
    if (authData) {
      if (authData.query) {
        query = { ...query, ...authData.query };
      }
      if (authData.headers) {
        headers = { ...headers, ...authData.headers };
      }
    }
    const queryString = query ? "?" + encodeQuery(query) : "";
    return new StreamIn(this.baseURL + path + queryString, headers);
  }
  // createStreamOut sets up a stream to a streaming API endpoint.
  async createStreamOut(path, params) {
    let { query, headers } = params ?? {};
    const authData = await this.getAuthData();
    if (authData) {
      if (authData.query) {
        query = { ...query, ...authData.query };
      }
      if (authData.headers) {
        headers = { ...headers, ...authData.headers };
      }
    }
    const queryString = query ? "?" + encodeQuery(query) : "";
    return new StreamOut(this.baseURL + path + queryString, headers);
  }
  // callTypedAPI makes an API call, defaulting content type to "application/json"
  async callTypedAPI(path, params) {
    return this.callAPI(path, {
      ...params,
      headers: { "Content-Type": "application/json", ...params == null ? void 0 : params.headers }
    });
  }
  // callAPI is used by each generated API method to actually make the request
  async callAPI(path, params) {
    let { query, headers, ...rest } = params ?? {};
    const init = {
      ...this.requestInit,
      ...rest
    };
    init.headers = { ...this.headers, ...init.headers, ...headers };
    const authData = await this.getAuthData();
    if (authData) {
      if (authData.query) {
        query = { ...query, ...authData.query };
      }
      if (authData.headers) {
        init.headers = { ...init.headers, ...authData.headers };
      }
    }
    const queryString = query ? "?" + encodeQuery(query) : "";
    const response = await this.fetcher(this.baseURL + path + queryString, init);
    if (!response.ok) {
      let body = { code: "unknown", message: `request failed: status ${response.status}` };
      try {
        const text = await response.text();
        try {
          const jsonBody = JSON.parse(text);
          if (isAPIErrorResponse(jsonBody)) {
            body = jsonBody;
          } else {
            body.message += ": " + JSON.stringify(jsonBody);
          }
        } catch {
          body.message += ": " + text;
        }
      } catch (e) {
        body.message += ": " + String(e);
      }
      throw new APIError(response.status, body);
    }
    return response;
  }
}
function isAPIErrorResponse(err) {
  return err !== void 0 && err !== null && isErrCode(err.code) && typeof err.message === "string" && (err.details === void 0 || err.details === null || typeof err.details === "object");
}
function isErrCode(code) {
  return code !== void 0 && Object.values(ErrCode).includes(code);
}
class APIError extends Error {
  constructor(status, response) {
    super(response.message);
    Object.defineProperty(this, "name", {
      value: "APIError",
      enumerable: false,
      configurable: true
    });
    if (Object.setPrototypeOf == void 0) {
      this.__proto__ = APIError.prototype;
    } else {
      Object.setPrototypeOf(this, APIError.prototype);
    }
    if (Error.captureStackTrace !== void 0) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.status = status;
    this.code = response.code;
    this.details = response.details;
  }
}
function isAPIError(err) {
  return err instanceof APIError;
}
var ErrCode = /* @__PURE__ */ ((ErrCode2) => {
  ErrCode2["OK"] = "ok";
  ErrCode2["Canceled"] = "canceled";
  ErrCode2["Unknown"] = "unknown";
  ErrCode2["InvalidArgument"] = "invalid_argument";
  ErrCode2["DeadlineExceeded"] = "deadline_exceeded";
  ErrCode2["NotFound"] = "not_found";
  ErrCode2["AlreadyExists"] = "already_exists";
  ErrCode2["PermissionDenied"] = "permission_denied";
  ErrCode2["ResourceExhausted"] = "resource_exhausted";
  ErrCode2["FailedPrecondition"] = "failed_precondition";
  ErrCode2["Aborted"] = "aborted";
  ErrCode2["OutOfRange"] = "out_of_range";
  ErrCode2["Unimplemented"] = "unimplemented";
  ErrCode2["Internal"] = "internal";
  ErrCode2["Unavailable"] = "unavailable";
  ErrCode2["DataLoss"] = "data_loss";
  ErrCode2["Unauthenticated"] = "unauthenticated";
  return ErrCode2;
})(ErrCode || {});
const backend = new Client("http://localhost:4000", { requestInit: { credentials: "include" } });
export {
  APIError,
  Client,
  Environment,
  ErrCode,
  Local,
  PreviewEnv,
  StreamIn,
  StreamInOut,
  StreamOut,
  analytics,
  auth,
  backend as default,
  health,
  isAPIError,
  metadata
};
