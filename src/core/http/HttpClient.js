// PATRÓN ADAPTER: adapta fetch() a una interfaz simple (get/post/put/delete)
// que es la única que conocen los servicios HTTP.
export class HttpError extends Error {
  constructor(status, body) {
    super(body?.message ?? body?.error ?? `Error HTTP ${status}`);
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
    let res;
    try{
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new HttpError(0, { message: 'No se pudo conectar con el servidor. Verifica tu conexión.' });
    }

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }
    if (!res.ok) throw new HttpError(res.status, data);
    return data;
  }

  get(path, opts) { return this.request('GET', path, opts); }
  post(path, body, opts) { return this.request('POST', path, { ...opts, body }); }
  put(path, body, opts) { return this.request('PUT', path, { ...opts, body }); }
  patch(path, body, opts) { return this.request('PATCH', path, { ...opts, body }); }
  delete(path, opts) { return this.request('DELETE', path, opts); }
}
