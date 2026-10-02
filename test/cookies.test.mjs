// The browser token contract: the SERVER sets httpOnly cookies, and the refresh token never
// appears in a response body a browser's JavaScript can read.
//
// Runs over real HTTP against an Express app wired the way @_linked/server wires providers
// (auth middleware first, RPCs at /call/<package>/<method>). Uses the BUILT package in lib/.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';

const SITE_ROOT = 'https://app.test';
const SECRET = 'cookie-test-secret-cookie-test-secret';
process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = SITE_ROOT;
process.env.JWT_SECRET = SECRET;
process.env.SESSION_SECRET = 'cookie-test-session-secret';
process.env.AUTH_SESSION_CLEANUP = 'false';

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linked-auth-cookie-test-'));
fs.mkdirSync(path.join(workDir, 'data'));
process.chdir(workDir);
process.on('exit', () => fs.rmSync(workDir, { recursive: true, force: true }));

const libDir = new URL('../lib/esm/', import.meta.url);
const { default: express } = await import('express');
const jwtUtils = await import(new URL('utils/jwt.js', libDir));
const tokenUtils = await import(new URL('utils/token.js', libDir));
const { Auth } = await import(new URL('utils/auth.js', libDir));
const { default: AuthBackendProvider } = await import(new URL('backend.js', libDir));
const sessions = await import(new URL('utils/sessions.js', libDir));
const cookies = await import(new URL('utils/cookies.js', libDir)).catch(() => null);

const PERSON = { id: 'https://id.test/person/ada' };
const ACCOUNT = { id: 'https://app.test/account/ada', email: 'ada@example.test', accountOf: PERSON };
const fakeLincdServer = { callGenericBackendProvidersMethod: async () => {} };

class TestProvider extends AuthBackendProvider {
  async loadAccountForSession(accountId) {
    return accountId === ACCOUNT.id ? { ...ACCOUNT } : null;
  }
  async loadUserForSession() {
    return { ...PERSON };
  }
  /** Every sign-in method ends in Auth.onSigninSuccessful; this is the shortest way there. */
  async signinFixture() {
    return Auth.onSigninSuccessful(this, { ...PERSON }, { ...ACCOUNT });
  }
}

/** An app wired like LinkedServer: provider middleware, a page route, and the RPC route. */
async function startApp({ trustProxy = false } = {}) {
  const app = express();
  app.lazyrouter();
  if (trustProxy) app.set('trust proxy', true);
  const provider = new TestProvider(app, fakeLincdServer);
  await provider.setupBeforeControllers();
  // a server-rendered page: what the auth middleware put on the request
  app.get('/page', (req, res) => {
    res.json({ account: req.linkedAuth?.userAccount?.id ?? null });
  });
  app.post('/call/@_linked/auth/:method', express.json(), async (req, res) => {
    provider.initRequest(req, res);
    const result = await provider[req.params.method](...(req.body?.args ?? []));
    if (!res.headersSent) res.json(result ?? null);
  });
  const server = await new Promise((resolve) => {
    const s = http.createServer(app).listen(0, '127.0.0.1', () => resolve(s));
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

/** Parse Set-Cookie headers into {name: {value, attrs}} (attribute names lower-cased). */
function setCookies(res) {
  const out = {};
  for (const line of res.headers.getSetCookie()) {
    const [pair, ...attrs] = line.split(';').map((p) => p.trim());
    const eq = pair.indexOf('=');
    const name = pair.slice(0, eq);
    const entry = { value: decodeURIComponent(pair.slice(eq + 1)), attrs: {} };
    for (const attr of attrs) {
      const [k, v] = attr.split('=');
      entry.attrs[k.toLowerCase()] = v === undefined ? true : v;
    }
    // several cookies with one name (e.g. two paths): keep them all
    (out[name] ??= []).push(entry);
  }
  return out;
}

const one = (jar, name, cookiePath) =>
  (jar[name] || []).find((c) => cookiePath === undefined || c.attrs.path === cookiePath);

async function rpc(url, method, args = [], { headers = {} } = {}) {
  const res = await fetch(`${url}/call/@_linked/auth/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ args }),
  });
  assert.equal(res.status, 200);
  return { res, body: await res.json(), jar: setCookies(res) };
}

let app;
before(async () => {
  app = await startApp();
});
after(() => app?.server.close());
beforeEach(() => {
  sessions.setRefreshSessionStore(new sessions.MemoryRefreshSessionStore());
  jwtUtils.clearAccessTokenCache();
});

test('sign-in: the server sets httpOnly cookies with the right flags', async () => {
  const { body, jar } = await rpc(app.url, 'signinFixture');

  const access = one(jar, 'accessToken');
  assert.ok(access, 'accessToken cookie set by the server');
  assert.equal(access.value, body.accessToken);
  assert.equal(access.attrs.httponly, true);
  assert.equal(access.attrs.samesite, 'Lax');
  assert.equal(access.attrs.path, '/');
  assert.equal(access.attrs.secure, true, 'SITE_ROOT is https');
  const accessExp = tokenUtils.jwtExpiryMs(body.accessToken);
  const accessMaxAge = Number(access.attrs['max-age']);
  assert.ok(
    Math.abs(accessMaxAge - (accessExp - Date.now()) / 1000) <= 2,
    `access Max-Age ${accessMaxAge} follows the token exp`
  );

  const refresh = one(jar, 'refreshToken', '/call/@_linked/auth');
  assert.ok(refresh, 'refreshToken cookie scoped to the auth endpoints');
  assert.equal(refresh.attrs.httponly, true);
  assert.equal(refresh.attrs.samesite, 'Strict');
  assert.equal(refresh.attrs.secure, true);
  assert.ok(
    Math.abs(Number(refresh.attrs['max-age']) - body.refreshTokenExpiresIn) <= 2,
    'refresh Max-Age follows the stored record expiry'
  );

  const hint = one(jar, 'linkedAuthSession');
  assert.ok(hint, 'session hint cookie');
  assert.equal(hint.attrs.httponly, undefined, 'the hint is readable by JS (it holds no secret)');
  assert.equal(hint.value, '1');
});

test('sign-in: a browser never receives the refresh token in the body', async () => {
  const { body, jar } = await rpc(app.url, 'signinFixture');
  assert.ok(body.accessToken, 'the access token is in the body (kept in memory)');
  assert.equal(body.refreshToken, undefined, 'no refresh token in the body');
  assert.ok(body.refreshTokenExpiresIn > 0, 'the session expiry is still reported');
  assert.ok(one(jar, 'refreshToken', '/call/@_linked/auth').value.length >= 43);
});

test('native clients (body transport) still get the refresh token in the body', async () => {
  const { body } = await rpc(app.url, 'signinFixture', [], {
    headers: { 'x-linked-auth-transport': 'body' },
  });
  assert.match(body.refreshToken, /^[A-Za-z0-9_-]{43}$/);
  const refreshed = await rpc(app.url, 'validateToken', [body.refreshToken, { forceRefresh: true }], {
    headers: { 'x-linked-auth-transport': 'body' },
  });
  assert.equal(refreshed.body.error, undefined);
  assert.ok(refreshed.body.refreshToken && refreshed.body.refreshToken !== body.refreshToken);
});

test('SSR: a page request carrying only the httpOnly access cookie is authenticated', async () => {
  const { jar } = await rpc(app.url, 'signinFixture');
  const res = await fetch(`${app.url}/page`, {
    headers: { cookie: `accessToken=${one(jar, 'accessToken').value}` },
  });
  assert.deepEqual(await res.json(), { account: ACCOUNT.id });
  // the refresh cookie alone does not authenticate a page (and is not sent there by browsers)
  const anon = await fetch(`${app.url}/page`, {
    headers: { cookie: `refreshToken=${one(jar, 'refreshToken').value}` },
  });
  assert.deepEqual(await anon.json(), { account: null });
});

test('a stale Bearer header does not hide a valid access cookie', async () => {
  const { jar } = await rpc(app.url, 'signinFixture');
  const res = await fetch(`${app.url}/page`, {
    headers: {
      authorization: 'Bearer not.a.validtoken',
      cookie: `accessToken=${one(jar, 'accessToken').value}`,
    },
  });
  assert.deepEqual(await res.json(), { account: ACCOUNT.id });
});

test('refresh with only the cookie: new cookies, rotated refresh token', async () => {
  const signin = await rpc(app.url, 'signinFixture');
  const oldRefresh = one(signin.jar, 'refreshToken').value;
  const refreshed = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${oldRefresh}` },
  });
  assert.equal(refreshed.body.error, undefined);
  assert.ok(jwtUtils.verifyAccessToken(refreshed.body.accessToken));
  assert.equal(refreshed.body.refreshToken, undefined);
  const newRefresh = one(refreshed.jar, 'refreshToken', '/call/@_linked/auth');
  assert.ok(newRefresh && newRefresh.value !== oldRefresh, 'a rotated refresh cookie');
  assert.equal(one(refreshed.jar, 'accessToken').value, refreshed.body.accessToken);
});

test('a lost refresh response: re-presenting the old cookie within the grace window sets a new refresh cookie', async () => {
  const signin = await rpc(app.url, 'signinFixture');
  const a = one(signin.jar, 'refreshToken').value;
  const toB = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${a}` },
  });
  const b = one(toB.jar, 'refreshToken').value;
  // B -> C, response dropped by the browser (navigation)
  await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${b}` },
  });
  const again = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${b}` },
  });
  assert.equal(again.body.error, undefined);
  const fresh = one(again.jar, 'refreshToken', '/call/@_linked/auth');
  assert.ok(fresh, 'the refresh cookie is replaced, not just the access cookie');
  assert.notEqual(fresh.value, b);
  const next = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${fresh.value}` },
  });
  assert.equal(next.body.error, undefined, 'the new cookie refreshes');
});

test('a failed refresh clears the cookies', async () => {
  const { jar } = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: 'refreshToken=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  });
  for (const name of ['accessToken', 'refreshToken', 'linkedAuthSession']) {
    assert.ok(
      (jar[name] || []).some((c) => /1970/.test(c.attrs.expires)),
      `${name} cleared`
    );
  }
});

test('sign-out: the server revokes the session and clears every auth cookie', async () => {
  const signin = await rpc(app.url, 'signinFixture');
  const access = one(signin.jar, 'accessToken').value;
  const refresh = one(signin.jar, 'refreshToken').value;
  const out = await rpc(app.url, 'signout', [], {
    headers: { cookie: `accessToken=${access}; refreshToken=${refresh}` },
  });
  assert.equal(out.body, true);
  const cleared = (name, p) =>
    (out.jar[name] || []).some((c) => c.attrs.path === p && /1970/.test(c.attrs.expires));
  assert.ok(cleared('accessToken', '/'), 'access cookie cleared');
  assert.ok(cleared('refreshToken', '/call/@_linked/auth'), 'refresh cookie cleared');
  assert.ok(cleared('refreshToken', '/'), 'a refresh cookie from an older client cleared too');
  assert.ok(cleared('linkedAuthSession', '/'), 'hint cleared');
  const after = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${refresh}` },
  });
  assert.ok(after.body.error, 'the refresh cookie no longer works');
});

test('a refresh cookie written by an older client on path / is replaced by the scoped one', async () => {
  const { jar } = await rpc(app.url, 'signinFixture', [], {
    headers: { cookie: 'refreshToken=legacy-from-js' },
  });
  assert.ok(
    (jar.refreshToken || []).some((c) => c.attrs.path === '/' && /1970/.test(c.attrs.expires)),
    'legacy cookie on / cleared'
  );
  assert.ok(one(jar, 'refreshToken', '/call/@_linked/auth'), 'scoped cookie set');
});

test('an ordinary refresh does not clear a legacy cookie that is not there', async () => {
  const signin = await rpc(app.url, 'signinFixture');
  const scoped = one(signin.jar, 'refreshToken').value;
  const refreshed = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${scoped}; linkedAuthSession=1` },
  });
  assert.equal(refreshed.body.error, undefined);
  assert.equal(
    (refreshed.jar.refreshToken || []).filter((c) => c.attrs.path === '/').length,
    0,
    'no Set-Cookie for refreshToken on / when only the scoped cookie was sent'
  );
});

test('a refresh that carries both the scoped and a legacy cookie clears the legacy one', async () => {
  const signin = await rpc(app.url, 'signinFixture');
  const scoped = one(signin.jar, 'refreshToken').value;
  // browsers send the more specific path first
  const refreshed = await rpc(app.url, 'validateToken', [null, { forceRefresh: true }], {
    headers: { cookie: `refreshToken=${scoped}; refreshToken=legacy; linkedAuthSession=1` },
  });
  assert.equal(refreshed.body.error, undefined);
  assert.ok(
    (refreshed.jar.refreshToken || []).some((c) => c.attrs.path === '/' && /1970/.test(c.attrs.expires)),
    'legacy cookie on / cleared'
  );
});

test('Secure follows https: req.secure behind a trusted proxy, plain http stays non-Secure', async () => {
  const saved = process.env.SITE_ROOT;
  process.env.SITE_ROOT = 'http://app.test';
  const proxied = await startApp({ trustProxy: true });
  const direct = await startApp({ trustProxy: false });
  try {
    const viaTls = await rpc(proxied.url, 'signinFixture', [], {
      headers: { 'x-forwarded-proto': 'https' },
    });
    assert.equal(one(viaTls.jar, 'accessToken').attrs.secure, true, 'trusted X-Forwarded-Proto');
    assert.equal(one(viaTls.jar, 'refreshToken').attrs.secure, true);

    const plain = await rpc(proxied.url, 'signinFixture');
    assert.equal(one(plain.jar, 'accessToken').attrs.secure, undefined, 'http: not Secure');

    const untrusted = await rpc(direct.url, 'signinFixture', [], {
      headers: { 'x-forwarded-proto': 'https' },
    });
    assert.equal(
      one(untrusted.jar, 'accessToken').attrs.secure,
      undefined,
      'X-Forwarded-Proto is ignored without trust proxy'
    );
  } finally {
    process.env.SITE_ROOT = saved;
    proxied.server.close();
    direct.server.close();
  }
});

test('cookie options: overrides and SameSite=None forcing Secure', () => {
  assert.ok(cookies, 'utils/cookies.js exists');
  const saved = { ...process.env };
  try {
    process.env.SITE_ROOT = 'http://app.test';
    const req = { secure: false, protocol: 'http' };
    assert.equal(cookies.accessCookieOptions(req).secure, false);
    process.env.AUTH_COOKIE_SECURE = 'true';
    assert.equal(cookies.accessCookieOptions(req).secure, true);
    delete process.env.AUTH_COOKIE_SECURE;
    process.env.AUTH_COOKIE_SAMESITE = 'none';
    const none = cookies.refreshCookieOptions(req);
    assert.equal(none.sameSite, 'none');
    assert.equal(none.secure, true, 'browsers drop SameSite=None without Secure');
    process.env.AUTH_REFRESH_COOKIE_PATH = '/app/call/@_linked/auth';
    assert.equal(cookies.refreshCookieOptions(req).path, '/app/call/@_linked/auth');
  } finally {
    for (const k of ['AUTH_COOKIE_SECURE', 'AUTH_COOKIE_SAMESITE', 'AUTH_REFRESH_COOKIE_PATH']) {
      delete process.env[k];
    }
    Object.assign(process.env, saved);
  }
});

test('default access token lifetime: 15 minutes in production, 1 hour in development', () => {
  const probe = (nodeEnv) => {
    const out = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const t = await import(${JSON.stringify(new URL('utils/token.js', libDir).href)});` +
          'console.log(JSON.stringify([t.ACCESS_TOKEN_EXPIRES, t.REFRESH_TOKEN_EXPIRES, t.SESSION_IDLE_TTL, t.SESSION_MAX_TTL]))',
      ],
      {
        env: { PATH: process.env.PATH, NODE_ENV: nodeEnv, SITE_ROOT },
        encoding: 'utf8',
      }
    );
    assert.equal(out.status, 0, out.stderr);
    return JSON.parse(out.stdout.trim().split('\n').pop());
  };
  assert.deepEqual(probe('production'), [15 * 60, 60 * 86400, 7 * 86400, 60 * 86400]);
  assert.deepEqual(probe('development'), [60 * 60, 30 * 86400, 7 * 86400, 60 * 86400]);
});
