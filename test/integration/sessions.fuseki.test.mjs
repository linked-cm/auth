// Stored refresh tokens against a REAL graph store: the RefreshToken shape queries, end to end
// through the provider's RPC methods (createAccount, signinWithPassword, validateToken, signout,
// resetPassword, removeAccount).
//
// Needs a Fuseki server. Creates a throwaway dataset and drops it afterwards; no other dataset is
// read or written.
//
//   AUTH_TEST_FUSEKI_URL=http://localhost:3030 AUTH_TEST_FUSEKI_USER=admin \
//   AUTH_TEST_FUSEKI_PASSWORD=... npm run test:integration
//
// Runs against the BUILT package in lib/ (build first).
import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const FUSEKI = process.env.AUTH_TEST_FUSEKI_URL?.replace(/\/+$/, '');
const USER = process.env.AUTH_TEST_FUSEKI_USER;
const PASSWORD = process.env.AUTH_TEST_FUSEKI_PASSWORD;
if (!FUSEKI || !USER || !PASSWORD) {
  // Fail loudly: a suite that silently skips proves nothing.
  throw new Error(
    'Set AUTH_TEST_FUSEKI_URL, AUTH_TEST_FUSEKI_USER and AUTH_TEST_FUSEKI_PASSWORD to run the integration tests'
  );
}

const SITE_ROOT = 'https://app.test';
const SECRET = 'integration-test-secret-integration';
process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = SITE_ROOT;
process.env.JWT_SECRET = SECRET;
process.env.SESSION_SECRET = 'integration-test-session-secret';

const DATASET = `linked-auth-test-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const authHeader = 'Basic ' + Buffer.from(`${USER}:${PASSWORD}`).toString('base64');

const libDir = new URL('../../lib/esm/', import.meta.url);
const { default: jwt } = await import('jsonwebtoken');
const { FusekiStore } = await import('@_linked/fuseki/shapes/FusekiStore');
const { LinkedStorage } = await import('@_linked/core/utils/LinkedStorage');
await import(new URL('shapes/index.js', libDir));
const { default: AuthBackendProvider } = await import(new URL('backend.js', libDir));

const fakeLincdServer = { callGenericBackendProvidersMethod: async () => {} };

async function sparql(query) {
  const res = await fetch(`${FUSEKI}/${DATASET}/sparql`, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/sparql-results+json',
    },
    body: new URLSearchParams({ query }),
  });
  assert.equal(res.status, 200, await res.clone().text());
  return (await res.json()).results.bindings;
}

before(async () => {
  const res = await fetch(`${FUSEKI}/$/datasets`, {
    method: 'POST',
    headers: { authorization: authHeader, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ dbName: DATASET, dbType: 'mem' }),
  });
  assert.equal(res.status, 200, `could not create test dataset: ${await res.text()}`);
  LinkedStorage.setDefaultDataset(
    new FusekiStore({
      endpoint: `${FUSEKI}/${DATASET}`,
      credentials: { username: USER, password: PASSWORD },
    })
  );
});

after(async () => {
  const res = await fetch(`${FUSEKI}/$/datasets/${DATASET}`, {
    method: 'DELETE',
    headers: { authorization: authHeader },
  });
  assert.equal(res.status, 200, `could not drop test dataset ${DATASET}`);
});

afterEach(() => mock.timers.reset());

function provider(request = { headers: {}, cookies: {} }) {
  const p = new AuthBackendProvider(null, fakeLincdServer);
  p.request = request;
  return p;
}

/** An access token for the same claims that has already expired. */
function expiredCopyOf(accessToken) {
  const { exp, iat, nbf, aud, iss, sub, jti, ...claims } = jwt.decode(accessToken);
  return jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, {
    audience: SITE_ROOT,
  });
}

/**
 * What the client does when its access token has expired: validateToken with the refresh token,
 * the expired access token still in the Authorization header.
 */
async function refresh(tokens, refreshToken = tokens.refreshToken) {
  const request = {
    headers: { authorization: `Bearer ${expiredCopyOf(tokens.accessToken)}` },
    cookies: {},
  };
  return provider(request).validateToken(refreshToken);
}

/** A request authenticated by the middleware with this access token. */
async function signedInProvider(accessToken) {
  const request = { headers: { authorization: `Bearer ${accessToken}` }, cookies: {} };
  const p = provider(request);
  assert.ok(await p.validateRequestToken(request), 'access token accepted');
  return p;
}

const PASSWORD_1 = 'first-Passw0rd!';
const PASSWORD_2 = 'second-Passw0rd!';
let email;
let created;

test('createAccount stores a refresh token that refreshes and rotates', async () => {
  email = `ada-${crypto.randomBytes(4).toString('hex')}@example.test`;
  created = await provider().createAccount({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email,
    password: PASSWORD_1,
  });
  assert.equal(created.error, undefined, created.error);

  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const refreshed = await refresh(created);
  assert.equal(refreshed.error, undefined, `refresh failed: ${refreshed.error}`);
  assert.ok(refreshed.accessToken);
  assert.ok(refreshed.refreshToken);
  assert.notEqual(refreshed.refreshToken, created.refreshToken);
  assert.equal(refreshed.auth.userAccount.email, email, 'account reloaded from the store');
  assert.equal(refreshed.auth.user.givenName, 'Ada', 'person reloaded from the store');

  mock.timers.tick(31_000);
  const reuse = await refresh(created, created.refreshToken);
  assert.ok(reuse.error, 'the replaced token is refused');
  const afterReuse = await refresh(refreshed, refreshed.refreshToken);
  assert.ok(afterReuse.error, 'reuse revoked the whole session');
});

test('the store holds a hash with dated metadata, never the raw token', async () => {
  const signin = await provider().signinWithPassword(email, PASSWORD_1);
  assert.equal(signin.error, undefined, signin.error);
  const hash = crypto.createHash('sha256').update(signin.refreshToken).digest('base64url');
  const rows = await sparql(`
    PREFIX auth: <http://lincd.org/ont/auth/>
    SELECT ?p ?o WHERE {
      { GRAPH ?g { ?s auth:tokenHash "${hash}" ; ?p ?o } }
      UNION { ?s auth:tokenHash "${hash}" ; ?p ?o }
    }`);
  const byPredicate = Object.fromEntries(rows.map((r) => [r.p.value.split('/').pop(), r.o]));
  assert.ok(byPredicate.sessionId, 'sessionId stored');
  assert.ok(byPredicate.account, 'account stored');
  for (const p of ['createdAt', 'expiresAt', 'lastUsedAt']) {
    assert.equal(
      byPredicate[p]?.datatype,
      'http://www.w3.org/2001/XMLSchema#dateTime',
      `${p} stored as xsd:dateTime`
    );
  }
  const raw = await sparql(`SELECT ?s WHERE { { ?s ?p "${signin.refreshToken}" } UNION { GRAPH ?g { ?s ?p "${signin.refreshToken}" } } }`);
  assert.equal(raw.length, 0, 'the raw refresh token is not stored');
});

test('signout revokes that session only', async () => {
  const deviceA = await provider().signinWithPassword(email, PASSWORD_1);
  const deviceB = await provider().signinWithPassword(email, PASSWORD_1);
  assert.equal(deviceA.error, undefined);

  const p = await signedInProvider(deviceA.accessToken);
  assert.equal(await p.signout(), true);

  assert.ok((await refresh(deviceA)).error, 'device A cannot refresh after signout');
  const b = await refresh(deviceB);
  assert.equal(b.error, undefined, `device B still signed in: ${b.error}`);
});

test('resetPassword revokes every session of the account', async () => {
  const deviceA = await provider().signinWithPassword(email, PASSWORD_1);
  const deviceB = await provider().signinWithPassword(email, PASSWORD_1);

  const p = await signedInProvider(deviceA.accessToken);
  const reset = await p.resetPassword(PASSWORD_2, PASSWORD_2, undefined);
  assert.equal(reset.error, undefined, reset.error);

  assert.ok((await refresh(deviceA)).error, 'device A revoked');
  assert.ok((await refresh(deviceB)).error, 'device B revoked');
  const current = await refresh(reset);
  assert.equal(current.error, undefined, 'the session started by the reset works');
  const withNewPassword = await provider().signinWithPassword(email, PASSWORD_2);
  assert.equal(withNewPassword.error, undefined);
});

test('removeAccount deletes the account\'s refresh token records', async () => {
  const signin = await provider().signinWithPassword(email, PASSWORD_2);
  const accountId = signin.auth.userAccount.id;
  const countFor = async () =>
    (
      await sparql(`
        PREFIX auth: <http://lincd.org/ont/auth/>
        SELECT ?s WHERE { { ?s auth:account <${accountId}> } UNION { GRAPH ?g { ?s auth:account <${accountId}> } } }`)
    ).length;
  assert.ok((await countFor()) > 0, 'records exist before removal');

  const p = await signedInProvider(signin.accessToken);
  assert.equal(await p.removeAccount(), true);
  assert.equal(await countFor(), 0, 'no records left for the removed account');
  assert.ok((await refresh(signin)).error, 'refresh fails for a removed account');
});
