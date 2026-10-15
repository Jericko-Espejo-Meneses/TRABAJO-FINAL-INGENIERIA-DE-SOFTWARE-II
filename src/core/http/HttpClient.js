// PATRÓN ADAPTER: adapta fetch() a una interfaz simple (get/post/put/delete)
// que es la única que conocen los servicios HTTP.
export class HttpError extends Error {
  constructor(status, body) {
    super(body?.message ?? `Error HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export class HttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(method, path, { body, params, headers } = {}) {
    const url = new URL(this.baseUrl + path, window.location.origin);
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
      else url.searchParams.set(key, value);
    });
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new HttpError(res.status, data);
    return data;
  }

  get(path, opts) { return this.request('GET', path, opts); }
  post(path, body, opts) { return this.request('POST', path, { ...opts, body }); }
  put(path, body, opts) { return this.request('PUT', path, { ...opts, body }); }
  delete(path, opts) { return this.request('DELETE', path, opts); }
}
