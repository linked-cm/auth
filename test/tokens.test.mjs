// Token kinds, stored refresh tokens and startup secrets.
//
// Runs against the BUILT package in lib/ (build first: `npx linked build`), with refresh token
// records in memory — no Fuseki needed. The same flows run against a real graph store in
// test/integration/ (`npm run test:integration`).
import { test, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const SITE_ROOT = 'https://app.test';
const SECRET = 'unit-test-secret-unit-test-secret';
process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = SITE_ROOT;
process.env.JWT_SECRET = SECRET;
process.env.SESSION_SECRET = 'unit-test-session-secret';

// connect-sqlite3 (express-session store) writes into <cwd>/data
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linked-auth-test-'));
fs.mkdirSync(path.join(workDir, 'data'));
process.chdir(workDir);
process.on('exit', () => fs.rmSync(workDir, { recursive: true, force: true }));

const libDir = new URL('../lib/esm/', import.meta.url);
const { default: jwt } = await import('jsonwebtoken');
const { default: express } = await import('express');
const jwtUtils = await import(new URL('utils/jwt.js', libDir));
const { Auth } = await import(new URL('utils/auth.js', libDir));
const { default: AuthBackendProvider } = await import(new URL('backend.js', libDir));
const sessions = await import(new URL('utils/sessions.js', libDir)).catch(() => null);

const PERSON = { id: 'https://id.test/person/ada' };
const ACCOUNT = { id: 'https://app.test/account/ada', email: 'ada@example.test', accountOf: PERSON };
const PAYLOAD = { user: PERSON, userAccount: ACCOUNT };

const fakeLincdServer = { callGenericBackendProvidersMethod: async () => {} };

/** The provider with the store lookups for the account/person replaced by fixtures. */
class TestProvider extends AuthBackendProvider {
  async loadAccountForSession(accountId) {
    return accountId === ACCOUNT.id ? { ...ACCOUNT } : null;
  }
  async loadUserForSession() {
    return { ...PERSON, givenName: 'Ada' };
  }
}

/** An express app the way LinkedServer hands it to providers (router already created). */
function newApp() {
  const app = express();
  app.lazyrouter();
  return app;
}

function newProvider(request = { headers: {}, cookies: {} }) {
  const provider = new TestProvider(null, fakeLincdServer);
  provider.request = request;
  return provider;
}

function requestWith({ bearer, cookies = {} } = {}) {
  return {
    headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    cookies,
  };
}

/** Sign in the way every sign-in method ends: Auth.onSigninSuccessful. */
async function signin() {
  const provider = newProvider();
  const result = await Auth.onSigninSuccessful(provider, { ...PERSON }, { ...ACCOUNT });
  assert.ok(result.accessToken, 'sign-in returns an access token');
  assert.ok(result.refreshToken, 'sign-in returns a refresh token');
  return result;
}

/** What the client does when its access token is gone: validateToken with the refresh token. */
async function refresh(refreshToken) {
  return newProvider(requestWith()).validateToken(refreshToken);
}

/** A token exactly as releases before token kinds signed them. */
function legacyToken(kind, { expiresIn = 3600 } = {}) {
  return jwt.sign({ ...PAYLOAD }, SECRET, {
    expiresIn,
    subject: PERSON.id,
    issuer: SITE_ROOT,
    ...(kind === 'access' ? { audience: SITE_ROOT } : {}),
  });
}

let memoryStore;
beforeEach(() => {
  if (sessions) {
    memoryStore = new sessions.MemoryRefreshSessionStore();
    sessions.setRefreshSessionStore(memoryStore);
  }
  jwtUtils.clearAccessTokenCache?.();
});
afterEach(() => mock.timers.reset());

// ---------------------------------------------------------------------------------------------
// The request middleware: which tokens authenticate a request
// ---------------------------------------------------------------------------------------------
let server;
let baseUrl;
before(async () => {
  const app = newApp();
  const provider = new TestProvider(app, fakeLincdServer);
  await provider.setupBeforeControllers();
  app.get('/whoami', (req, res) => {
    res.json({ account: req.linkedAuth?.userAccount?.id ?? null });
  });
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server?.close();
});

async function whoami({ bearer, cookie } = {}) {
  const headers = {};
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${baseUrl}/whoami`, { headers });
  assert.equal(res.status, 200);
  return (await res.json()).account;
}

test('an access token as Bearer authenticates the request', async () => {
  const { accessToken } = await signin();
  assert.equal(await whoami({ bearer: accessToken }), ACCOUNT.id);
});

test('a refresh token as Bearer does NOT authenticate the request', async () => {
  const { refreshToken } = await signin();
  assert.equal(await whoami({ bearer: refreshToken }), null);
});

test('a legacy refresh token (JWT without aud) as Bearer does NOT authenticate the request', async () => {
  assert.equal(await whoami({ bearer: legacyToken('refresh') }), null);
});

test('a legacy refresh token in the accessToken cookie does NOT authenticate the request', async () => {
  assert.equal(
    await whoami({ cookie: `accessToken=${legacyToken('refresh')}` }),
    null
  );
});

test('a legacy access token (no typ, with aud) still authenticates the request', async () => {
  assert.equal(await whoami({ bearer: legacyToken('access') }), ACCOUNT.id);
});

test('an access token for another audience does not authenticate the request', async () => {
  const token = jwt.sign({ ...PAYLOAD, typ: 'access' }, SECRET, {
    expiresIn: 3600,
    audience: 'https://other.test',
  });
  assert.equal(await whoami({ bearer: token }), null);
});

test('verifyAccessToken: accepts access tokens, refuses refresh tokens', async () => {
  assert.equal(typeof jwtUtils.verifyAccessToken, 'function', 'verifyAccessToken is exported');
  const { accessToken, refreshToken } = await signin();
  const claims = jwtUtils.verifyAccessToken(accessToken);
  assert.equal(claims.typ, 'access');
  assert.equal(claims.aud, SITE_ROOT);
  assert.ok(claims.sid, 'access token carries the session id');
  assert.ok(claims.jti, 'access token carries a jti');
  assert.equal(claims.userAccount.id, ACCOUNT.id);
  assert.equal(jwtUtils.verifyAccessToken(refreshToken), false);
  assert.equal(jwtUtils.verifyAccessToken(legacyToken('refresh')), false);
  assert.ok(jwtUtils.verifyAccessToken(legacyToken('access')));
  const otherKind = jwt.sign({ ...PAYLOAD, typ: 'refresh' }, SECRET, {
    expiresIn: 3600,
    audience: SITE_ROOT,
  });
  assert.equal(jwtUtils.verifyAccessToken(otherKind), false);
});

// ---------------------------------------------------------------------------------------------
// Refresh: the validateToken RPC
// ---------------------------------------------------------------------------------------------
test('an access token is not accepted as a refresh token', async () => {
  const { accessToken } = await signin();
  const result = await refresh(accessToken);
  assert.ok(result.error, 'refused');
  assert.equal(result.accessToken, undefined);
});

test('a legacy refresh token (never stored) is refused', async () => {
  const result = await refresh(legacyToken('refresh'));
  assert.ok(result.error, 'refused');
});

test('a stored refresh token returns new tokens and is rotated', async () => {
  const first = await signin();
  const result = await refresh(first.refreshToken);
  assert.equal(result.error, undefined, `refresh failed: ${result.error}`);
  assert.ok(result.accessToken);
  assert.ok(result.refreshToken);
  assert.notEqual(result.refreshToken, first.refreshToken, 'a new refresh token');
  assert.equal(result.auth.userAccount.id, ACCOUNT.id);
  assert.equal(result.auth.user.givenName, 'Ada', 'the person is reloaded');

  const claims = jwtUtils.verifyAccessToken(result.accessToken);
  assert.ok(claims, 'the new access token is valid');
  assert.equal(
    claims.sid,
    jwtUtils.verifyAccessToken(first.accessToken).sid,
    'same session'
  );
  // the request is authenticated with the new token
  assert.equal(await whoami({ bearer: result.accessToken }), ACCOUNT.id);
  // and the new refresh token works in turn
  const again = await refresh(result.refreshToken);
  assert.equal(again.error, undefined);
});

test('an expired access token plus a refresh token refreshes (the client contract)', async () => {
  const first = await signin();
  const expiredAccess = jwt.sign(
    { ...PAYLOAD, typ: 'access', exp: Math.floor(Date.now() / 1000) - 10 },
    SECRET,
    { audience: SITE_ROOT }
  );
  const result = await newProvider(requestWith({ bearer: expiredAccess })).validateToken(
    first.refreshToken
  );
  assert.equal(result.error, undefined, `refresh failed: ${result.error}`);
  assert.ok(jwtUtils.verifyAccessToken(result.accessToken));
});

test('a rotated refresh token is rejected, and reusing it revokes the session', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const first = await signin();
  const second = await refresh(first.refreshToken);
  assert.equal(second.error, undefined, `refresh failed: ${second.error}`);

  mock.timers.tick(31_000); // past the concurrent-tab grace window
  const reuse = await refresh(first.refreshToken);
  assert.ok(reuse.error, 'the replaced token is refused');

  // the reuse ended the session: the token that replaced it is dead too
  const afterReuse = await refresh(second.refreshToken);
  assert.ok(afterReuse.error, 'the whole session is revoked after reuse');
});

test('reuse within the grace window (concurrent tabs) gives an access token but no refresh token', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const first = await signin();
  const second = await refresh(first.refreshToken);
  assert.equal(second.error, undefined);

  mock.timers.tick(5_000);
  const otherTab = await refresh(first.refreshToken);
  assert.equal(otherTab.error, undefined, 'the second tab is not signed out');
  assert.ok(jwtUtils.verifyAccessToken(otherTab.accessToken));
  assert.equal(otherTab.refreshToken, undefined, 'no second refresh token in the family');

  // the session is intact
  const third = await refresh(second.refreshToken);
  assert.equal(third.error, undefined);
});

test('an expired refresh token is refused', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const first = await signin();
  mock.timers.tick(61 * 24 * 60 * 60 * 1000); // longer than any default refresh lifetime
  const result = await refresh(first.refreshToken);
  assert.ok(result.error, 'refused');
});

test('signout revokes the session: its refresh token fails afterwards, other sessions survive', async () => {
  const deviceA = await signin();
  const deviceB = await signin();

  // signed in on device A, the way the request middleware sets it up
  const request = requestWith({ bearer: deviceA.accessToken });
  const provider = newProvider(request);
  await provider.validateRequestToken(request);
  assert.equal(await provider.signout(), true);

  const refreshA = await refresh(deviceA.refreshToken);
  assert.ok(refreshA.error, 'device A cannot refresh after signing out');
  const refreshB = await refresh(deviceB.refreshToken);
  assert.equal(refreshB.error, undefined, 'device B is still signed in');
});

test('signout with only the refresh token (expired access token) revokes that session', async () => {
  const device = await signin();
  const provider = newProvider(requestWith());
  assert.equal(await provider.signout(device.refreshToken), true);
  assert.ok((await refresh(device.refreshToken)).error);
});

test('revoking all sessions of an account (password reset) ends every session', async () => {
  assert.ok(sessions, 'utils/sessions is exported');
  const deviceA = await signin();
  const deviceB = await signin();
  const revoked = await sessions.revokeAllSessionsForAccount(ACCOUNT.id);
  assert.equal(revoked, 2);
  assert.ok((await refresh(deviceA.refreshToken)).error);
  assert.ok((await refresh(deviceB.refreshToken)).error);
});

test('only a hash of the refresh token is stored', async () => {
  const { refreshToken } = await signin();
  const records = [...memoryStore.records.values()];
  assert.equal(records.length, 1);
  assert.equal(records[0].tokenHash, sessions.hashRefreshToken(refreshToken));
  assert.ok(!JSON.stringify(records).includes(refreshToken), 'the raw token is not stored');
  assert.match(refreshToken, /^[A-Za-z0-9_-]{43}$/, '32 random bytes, base64url');
});

test('updateSessionData keeps the session and the client refresh token', async () => {
  const first = await signin();
  const request = requestWith({
    bearer: first.accessToken,
    cookies: { refreshToken: first.refreshToken },
  });
  const provider = newProvider(request);
  await provider.validateRequestToken(request);
  const updated = await request.linkedAuth.updateSessionData({
    user: { givenName: 'Ada L.' },
  });
  const claims = jwtUtils.verifyAccessToken(updated.accessToken);
  assert.ok(claims, 'a valid access token');
  assert.equal(claims.user.givenName, 'Ada L.');
  assert.equal(claims.sid, jwtUtils.verifyAccessToken(first.accessToken).sid);
  assert.equal(updated.refreshToken, first.refreshToken);
  assert.equal((await refresh(first.refreshToken)).error, undefined, 'still refreshable');
});

// ---------------------------------------------------------------------------------------------
// Verification cache
// ---------------------------------------------------------------------------------------------
test('the verification cache does not serve an expired token', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const token = jwt.sign({ ...PAYLOAD, typ: 'access' }, SECRET, {
    expiresIn: 2,
    audience: SITE_ROOT,
  });
  const provider = newProvider();
  const args = { request: provider.request, token, provider };
  assert.ok(await jwtUtils.verifyToken(args), 'valid while fresh (and now cached)');
  mock.timers.tick(3_000);
  assert.equal(await jwtUtils.verifyToken(args), false, 'expired, even though it was cached');
});

// ---------------------------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------------------------
async function setupWithEnv(env) {
  const saved = {};
  for (const key of Object.keys(env)) {
    saved[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try {
    const provider = new TestProvider(newApp(), fakeLincdServer);
    await provider.setupBeforeControllers();
    await provider.dispose();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('startup throws in production when JWT_SECRET is missing', async () => {
  await assert.rejects(
    setupWithEnv({ NODE_ENV: 'production', JWT_SECRET: undefined }),
    /JWT_SECRET/
  );
});

test('startup throws in production when SESSION_SECRET is missing', async () => {
  await assert.rejects(
    setupWithEnv({ NODE_ENV: 'production', SESSION_SECRET: undefined }),
    /SESSION_SECRET/
  );
});

test('startup works in production when both secrets are set', async () => {
  await setupWithEnv({ NODE_ENV: 'production' });
});

test('development keeps working without secrets', async () => {
  await setupWithEnv({
    NODE_ENV: 'development',
    JWT_SECRET: undefined,
    SESSION_SECRET: undefined,
  });
});
