const APPS = Object.freeze(['nestapp', 'eeg-cap-viewer', 'paper-review']);
const MAX_BODY_BYTES = 1024;
const EVENT_RETENTION_SECONDS = 24 * 60 * 60;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COUNT_SQL = 'SELECT app, opens FROM app_counters ORDER BY app';

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin || origin === 'null') return null;
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  // Literal origins only: no wildcards, prefixes, paths, or credentials.
  return allowed.some(value => {
    try {
      const parsed = new URL(value);
      return ['https:', 'http:'].includes(parsed.protocol) && parsed.origin === value && value === origin;
    } catch { return false; }
  }) ? origin : null;
}

function reply(status, data, origin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin',
    ...extraHeaders,
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(status === 204 ? null : JSON.stringify(data), {status, headers});
}

async function readJSON(request) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new RequestError(415, 'Use application/json.');
  const declared = request.headers.get('Content-Length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw new RequestError(413, 'Request body is too large.');
  }
  if (!request.body) throw new RequestError(400, 'A JSON body is required.');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestError(413, 'Request body is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body;
  try { body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
  catch { throw new RequestError(400, 'Invalid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RequestError(400, 'Expected a JSON object.');
  return body;
}

function requireKeys(body, keys) {
  const found = Object.keys(body);
  if (found.length !== keys.length || found.some(key => !keys.includes(key))) {
    throw new RequestError(400, 'Unexpected or missing fields.');
  }
}

async function requireOwner(request, env) {
  const secret = env.ADMIN_TOKEN;
  if (typeof secret !== 'string' || !/^[\x21-\x7e]{32,256}$/.test(secret)) {
    throw new RequestError(503, 'Owner reset is not configured.');
  }
  const authorization = request.headers.get('Authorization') || '';
  const token = /^Bearer ([\x21-\x7e]{1,256})$/.exec(authorization)?.[1];
  if (!token) throw new RequestError(401, 'Owner authentication required.');
  // Compare fixed-size hashes without an early-return prefix comparison.
  const encoder = new TextEncoder();
  const digests = await Promise.all([secret, token].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const expected = new Uint8Array(digests[0]);
  const actual = new Uint8Array(digests[1]);
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
  if (difference !== 0) throw new RequestError(401, 'Owner authentication required.');
}

function countResult(result) {
  const rows = result.results || [];
  if (rows.length !== APPS.length) throw new Error('Counter schema is incomplete.');
  const counts = {};
  for (const app of APPS) {
    const row = rows.find(value => value.app === app);
    if (!row || !Number.isSafeInteger(row.opens) || row.opens < 0) throw new Error('Counter data is invalid.');
    counts[app] = row.opens;
  }
  return {counts};
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return reply(403, {error: 'Origin not allowed.'}, null);
    const path = new URL(request.url).pathname;
    const method = path === '/counts' ? 'GET' : ['/visit', '/reset'].includes(path) ? 'POST' : null;
    if (!method) return reply(404, {error: 'Not found.'}, origin);
    if (request.method === 'OPTIONS') {
      const requestedMethod = request.headers.get('Access-Control-Request-Method');
      const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
      if (requestedMethod !== method || requestedHeaders.some(value => !['content-type', 'authorization'].includes(value))) {
        return reply(403, {error: 'Preflight not allowed.'}, origin);
      }
      return reply(204, null, origin, {
        'Access-Control-Allow-Methods': `${method}, OPTIONS`,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      });
    }
    if (request.method !== method) return reply(405, {error: 'Method not allowed.'}, origin, {Allow: `${method}, OPTIONS`});
    try {
      if (path === '/counts') return reply(200, countResult(await env.DB.prepare(COUNT_SQL).all()), origin);
      if (path === '/reset') await requireOwner(request, env);
      const body = await readJSON(request);
      if (path === '/visit') {
        requireKeys(body, ['app', 'eventId']);
        if (!APPS.includes(body.app) || typeof body.eventId !== 'string' || !UUID_V4.test(body.eventId)) {
          throw new RequestError(400, 'Invalid app or eventId.');
        }
        // The database trigger increments only when this event is first inserted.
        // D1 batch is transactional: insertion and returned totals share one transaction.
        const results = await env.DB.batch([
          env.DB.prepare('INSERT INTO visit_events (app, event_id, created_at) VALUES (?, ?, ?) ON CONFLICT(app, event_id) DO NOTHING')
            .bind(body.app, body.eventId.toLowerCase(), Math.floor(Date.now() / 1000)),
          env.DB.prepare(COUNT_SQL),
        ]);
        return reply(200, countResult(results[1]), origin);
      }
      requireKeys(body, ['app']);
      if (body.app !== 'all' && !APPS.includes(body.app)) throw new RequestError(400, 'Invalid app.');
      const reset = body.app === 'all'
        ? env.DB.prepare('UPDATE app_counters SET opens = 0')
        : env.DB.prepare('UPDATE app_counters SET opens = 0 WHERE app = ?').bind(body.app);
      // Keep recent visit_events so a retry from before the reset cannot restore it.
      const results = await env.DB.batch([reset, env.DB.prepare(COUNT_SQL)]);
      return reply(200, countResult(results[1]), origin);
    } catch (error) {
      if (error instanceof RequestError) return reply(error.status, {error: error.message}, origin);
      // Do not log request headers, tokens, bodies, IPs, URLs, or database errors.
      return reply(503, {error: 'Counter service unavailable.'}, origin);
    }
  },

  async scheduled(controller, env) {
    const now = Number.isFinite(controller.scheduledTime) ? controller.scheduledTime : Date.now();
    // Only short-lived retry IDs are removed; cumulative counts remain intact.
    await env.DB.prepare('DELETE FROM visit_events WHERE created_at < ?')
      .bind(Math.floor(now / 1000) - EVENT_RETENTION_SECONDS).run();
  },
};
