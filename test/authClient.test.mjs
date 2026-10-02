// The client side of keeping a session alive: refresh scheduler, single-flight refresh,
// retry-once after 401, and token storage (web: memory only; native: the app's storage).
//
// Server.call runs over real HTTP against a tiny server that accepts exactly one access token.
// Uses the BUILT package in lib/.
import { test, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// --- a backend that only accepts the CURRENT access token ------------------------------------
let validToken = 'token-1';
const seen = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    seen.push({ url: req.url, auth: req.headers.authorization ?? null, headers: req.headers });
    if (req.url.startsWith('/call/@_linked/auth/')) {
      res.writeHead(401).end();
      return;
    }
    if (req.headers.authorization !== `Bearer ${validToken}`) {
      res.writeHead(401, { 'content-type': 'application/json' }).end('{"error":"expired"}');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end('{"ok":true}');
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = `http://127.0.0.1:${server.address().port}`;

const libDir = new URL('../lib/esm/', import.meta.url);
const client = await import(new URL('utils/authClient.js', libDir));
const tokenUtils = await import(new URL('utils/token.js', libDir));
const { Server } = await import('@_linked/server-utils/utils/Server');
const { LincdServerProxy } = await import('@_linked/server-utils/utils/LincdServerProxy');

/** An unsigned JWT-shaped token with this exp (the client never verifies signatures). */
function tokenExpiringAt(expMs, id = Math.random().toString(36).slice(2)) {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${enc({ alg: 'HS256' })}.${enc({ exp: Math.floor(expMs / 1000), jti: id })}.sig`;
}

after(() => server.close());
beforeEach(() => {
  client.resetAuthClient();
  client.setAccessToken(null);
  client.setRefreshHandler(undefined);
  seen.length = 0;
});
afterEach(() => mock.timers.reset());

// --- scheduler --------------------------------------------------------------------------------
test('scheduler: refreshes about 60 s before the access token expires, not earlier', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000_000_000 });
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    return true;
  });
  const now = Date.now();
  client.setAccessToken(tokenExpiringAt(now + 15 * 60 * 1000), now);

  mock.timers.tick(15 * 60 * 1000 - 61 * 1000);
  await Promise.resolve();
  assert.equal(refreshes, 0, 'not before exp - 60 s');
  mock.timers.tick(2 * 1000);
  await new Promise((r) => setImmediate(r));
  assert.equal(refreshes, 1, 'refreshed once just before exp');
});

test('scheduler: a new token reschedules; a token with an unchanged exp does not loop', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000_000_000 });
  const t0 = Date.now();
  const exp = t0 + 10 * 60 * 1000;
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    client.setAccessToken(tokenExpiringAt(exp)); // the server had nothing to rotate
    return true;
  });
  client.setAccessToken(tokenExpiringAt(exp), t0);
  mock.timers.tick(10 * 60 * 1000 - 59 * 1000);
  await new Promise((r) => setImmediate(r));
  assert.equal(refreshes, 1);
  // the same exp must not be scheduled 60 s before itself again (that would fire at once)
  mock.timers.tick(30 * 1000);
  await new Promise((r) => setImmediate(r));
  assert.equal(refreshes, 1, 'no refresh loop');
});

test('scheduler: a server-rendered page schedules from exp alone', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000_000_000 });
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    return true;
  });
  client.scheduleRefreshAt(Date.now() + 5 * 60 * 1000);
  mock.timers.tick(5 * 60 * 1000 - 59 * 1000);
  await new Promise((r) => setImmediate(r));
  assert.equal(refreshes, 1);
});

test('visibility/focus: refreshes only when the token is (nearly) expired', async () => {
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    return true;
  });
  const now = Date.now();
  client.scheduleRefreshAt(now + 10 * 60 * 1000, now);
  assert.equal(client.refreshIfStale(now), undefined, 'fresh token: nothing to do');
  await client.refreshIfStale(now + 10 * 60 * 1000 + 1);
  assert.equal(refreshes, 1, 'woke up after exp: refreshed');
  client.clearScheduledRefresh();
});

// --- single flight ----------------------------------------------------------------------------
test('single flight: N concurrent refresh requests run ONE refresh', async () => {
  let calls = 0;
  let release;
  client.setRefreshHandler(() => {
    calls++;
    if (calls > 1) return Promise.resolve(true);
    return new Promise((resolve) => (release = () => resolve(true)));
  });
  const all = Promise.all(Array.from({ length: 8 }, () => client.refreshAccessToken()));
  await new Promise((r) => setImmediate(r));
  release();
  assert.deepEqual(await all, Array(8).fill(true));
  assert.equal(calls, 1);
  // the next refresh after it settled is a new one
  await client.refreshAccessToken();
  assert.equal(calls, 2);
});

test('single flight: a throwing refresh resolves false for everyone', async () => {
  client.setRefreshHandler(async () => {
    throw new Error('network down');
  });
  const warn = mock.method(console, 'warn', () => {});
  try {
    assert.deepEqual(
      await Promise.all([client.refreshAccessToken(), client.refreshAccessToken()]),
      [false, false]
    );
  } finally {
    warn.mock.restore();
  }
});

// --- retry once after 401 ---------------------------------------------------------------------
test('401 → one refresh → one retry with the new token', async () => {
  assert.equal(client.installServerCallRetry(), true);
  validToken = 'token-2';
  client.setAccessToken('token-1');
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    client.setAccessToken('token-2');
    return true;
  });
  const result = await Server.call('some-package', 'getThings');
  assert.deepEqual(result, { ok: true });
  assert.equal(refreshes, 1);
  assert.deepEqual(
    seen.map((s) => s.auth),
    ['Bearer token-1', 'Bearer token-2'],
    'first with the old token, retried once with the new one'
  );
});

test('401 retry does not loop: a second 401 goes to the caller', async () => {
  client.installServerCallRetry();
  validToken = 'never-valid';
  client.setAccessToken('token-1');
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    client.setAccessToken(`token-r${refreshes}`);
    return true;
  });
  const warn = mock.method(console, 'warn', () => {});
  try {
    await assert.rejects(Server.call('some-package', 'getThings'), /Not authenticated/);
  } finally {
    warn.mock.restore();
  }
  assert.equal(refreshes, 1, 'one refresh');
  assert.equal(seen.length, 2, 'one retry');
});

test('a failed refresh is not retried', async () => {
  client.installServerCallRetry();
  validToken = 'token-2';
  client.setAccessToken('token-1');
  client.setRefreshHandler(async () => false);
  const warn = mock.method(console, 'warn', () => {});
  try {
    await assert.rejects(Server.call('some-package', 'getThings'));
  } finally {
    warn.mock.restore();
  }
  assert.equal(seen.length, 1);
});

test('concurrent 401s share one refresh and all retry', async () => {
  client.installServerCallRetry();
  validToken = 'token-2';
  client.setAccessToken('token-1');
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    await new Promise((r) => setTimeout(r, 20));
    client.setAccessToken('token-2');
    return true;
  });
  const results = await Promise.all(
    Array.from({ length: 5 }, () => Server.call('some-package', 'getThings'))
  );
  assert.deepEqual(results, Array(5).fill({ ok: true }));
  assert.equal(refreshes, 1);
});

test("auth's own endpoints are never intercepted (they are the refresh)", async () => {
  client.installServerCallRetry();
  client.setAccessToken('token-1');
  let refreshes = 0;
  client.setRefreshHandler(async () => {
    refreshes++;
    return true;
  });
  const warn = mock.method(console, 'warn', () => {});
  try {
    await assert.rejects(Server.call('@_linked/auth', 'validateToken'));
  } finally {
    warn.mock.restore();
  }
  assert.equal(refreshes, 0);
  assert.equal(seen.length, 1);
});

test('a call about to go out with an expired token refreshes first', async () => {
  client.installServerCallRetry();
  validToken = 'token-fresh';
  client.setAccessToken(tokenExpiringAt(Date.now() - 1000, 'old'));
  client.setRefreshHandler(async () => {
    validToken = 'token-fresh';
    client.setAccessToken('token-fresh');
    return true;
  });
  assert.deepEqual(await Server.call('some-package', 'getThings'), { ok: true });
  assert.deepEqual(seen.map((s) => s.auth), ['Bearer token-fresh'], 'no failed request first');
});

test('installing twice wraps once', () => {
  const before = LincdServerProxy.prototype.fetchWithRetry;
  client.installServerCallRetry();
  assert.equal(LincdServerProxy.prototype.fetchWithRetry, before);
});

// --- token storage ----------------------------------------------------------------------------
test('web: the access token lives in memory only; the refresh token is never stored by JS', async () => {
  assert.equal(tokenUtils.isNativeTokenStorage(), false);
  await tokenUtils.storeAuthTokens({ accessToken: 'a.b.c', refreshToken: 'opaque' });
  assert.equal(await tokenUtils.getAuthToken(tokenUtils.ACCESS_TOKEN), 'a.b.c');
  assert.equal(await tokenUtils.getAuthToken(tokenUtils.REFRESH_TOKEN), undefined);
  assert.equal(typeof globalThis.document, 'undefined', 'and nothing touched document.cookie');
  await tokenUtils.removeAuthToken(tokenUtils.ACCESS_TOKEN);
  assert.equal(await tokenUtils.getAuthToken(tokenUtils.ACCESS_TOKEN), undefined);
});

test('setAccessToken(null) removes the Authorization header', () => {
  client.setAccessToken('token-x');
  assert.equal(LincdServerProxy.defaultHeaders.Authorization, 'Bearer token-x');
  client.setAccessToken(null);
  assert.equal(LincdServerProxy.defaultHeaders.Authorization, undefined);
});

// Runs last: registering native storage is process-wide.
test('native: registered storage keeps both tokens, and the server is asked for body transport', async () => {
  const values = new Map();
  const writes = [];
  tokenUtils.setAuthTokenStorageMethods(
    async (k) => values.get(k),
    async (k, v, e) => {
      values.set(k, v);
      writes.push({ k, e });
    },
    async (k) => values.delete(k)
  );
  assert.equal(tokenUtils.isNativeTokenStorage(), true);
  assert.equal(LincdServerProxy.defaultHeaders['x-linked-auth-transport'], 'body');
  const access = tokenExpiringAt(Date.now() + 900_000);
  await tokenUtils.storeAuthTokens({ accessToken: access, refreshToken: 'opaque', refreshTokenExpiresIn: 3600 });
  assert.equal(values.get('accessToken'), access);
  assert.equal(values.get('refreshToken'), 'opaque');
  assert.equal(writes.find((w) => w.k === 'refreshToken').e, 3600);
  assert.ok(Math.abs(writes.find((w) => w.k === 'accessToken').e - 900) <= 1);

  // and a call carries the transport header
  validToken = 'n';
  client.setAccessToken('n');
  await Server.call('some-package', 'getThings');
  assert.equal(seen.at(-1).headers['x-linked-auth-transport'], 'body');
});
