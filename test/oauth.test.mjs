// signinOAuth only signs in with providers whose token the server verifies itself.
//
// Runs against the BUILT package in lib/ (build first: `npx linked build`). No network and no
// store: the token helpers and `Auth.login` are stubbed, so these tests only check which inputs
// are allowed to reach the login step and with which email.
import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = 'https://app.test';
process.env.JWT_SECRET = 'unit-test-secret-unit-test-secret';
process.env.SESSION_SECRET = 'unit-test-session-secret';

// connect-sqlite3 (express-session store) writes into <cwd>/data
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linked-auth-test-'));
fs.mkdirSync(path.join(workDir, 'data'));
process.chdir(workDir);
process.on('exit', () => fs.rmSync(workDir, { recursive: true, force: true }));

const libDir = new URL('../lib/esm/', import.meta.url);
const { Auth } = await import(new URL('utils/auth.js', libDir));
const { default: AppleHelper } = await import(new URL('helpers/apple.js', libDir));
const { default: GoogleHelper } = await import(new URL('helpers/google.js', libDir));
const { default: AuthBackendProvider } = await import(new URL('backend.js', libDir));
const { emailToWebID } = await import(new URL('utils/webID.js', libDir));

const fakeLincdServer = { callGenericBackendProvidersMethod: async () => {} };
const SIGNED_IN = { user: { id: 'https://id.test/person/x' }, userAccount: { id: 'acc' } };

let provider;
let login;

beforeEach(() => {
  provider = new AuthBackendProvider(null, fakeLincdServer);
  login = mock.method(Auth, 'login', async () => SIGNED_IN);
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
});

afterEach(() => {
  mock.restoreAll();
});

/** The label `Auth.login` was called with, one per call. */
const loginLabels = () => login.mock.calls.map((call) => call.arguments[3]);

/**
 * The WebID the existing-account lookup of the first `Auth.login` call asks for. The account
 * shape is replaced by a stub that records the `accountOf` it is filtered on.
 */
async function lookedUpWebID() {
  let webID;
  provider.accountShape = {
    select: () => ({
      where: (filter) => {
        filter({ accountOf: { equals: (node) => (webID = node.id) } });
        return { one: async () => null };
      },
    }),
  };
  await login.mock.calls[0].arguments[1]();
  return webID;
}

test('facebook with a client-supplied email is rejected and never reaches login', async () => {
  const result = await provider.signinOAuth('facebook', {
    email: 'victim@example.test',
    name: 'Victim',
  });
  assert.equal(login.mock.callCount(), 0, `login was called: ${JSON.stringify(loginLabels())}`);
  assert.ok(result?.error, `expected an error, got ${JSON.stringify(result)}`);
});

test('an unknown provider is rejected and never reaches login', async () => {
  const result = await provider.signinOAuth('github', { email: 'victim@example.test' });
  assert.equal(login.mock.callCount(), 0, `login was called: ${JSON.stringify(loginLabels())}`);
  assert.ok(result?.error, `expected an error, got ${JSON.stringify(result)}`);
});

test('a missing provider is rejected and never reaches login', async () => {
  const result = await provider.signinOAuth(undefined, { email: 'victim@example.test' });
  assert.equal(login.mock.callCount(), 0, `login was called: ${JSON.stringify(loginLabels())}`);
  assert.ok(result?.error, `expected an error, got ${JSON.stringify(result)}`);
});

test('google signs in with the email from the verified ID token, not the client', async () => {
  const validate = mock.method(GoogleHelper, 'validateIdToken', async () => ({
    sub: 'g-1',
    email: 'ada@example.test',
    email_verified: true,
    name: 'Ada Lovelace',
    given_name: 'Ada',
    family_name: 'Lovelace',
  }));
  const result = await provider.signinOAuth('google', {
    email: 'victim@example.test',
    authentication: { idToken: 'google-id-token' },
  });
  assert.equal(validate.mock.calls[0].arguments[0], 'google-id-token');
  assert.deepEqual(loginLabels(), ['google OAuth']);
  assert.equal(await lookedUpWebID(), emailToWebID('ada@example.test'));
  assert.equal(result, SIGNED_IN);
});

test('google without an ID token is rejected', async () => {
  const result = await provider.signinOAuth('google', { email: 'victim@example.test' });
  assert.deepEqual(result, { error: 'No Google ID token provided' });
  assert.equal(login.mock.callCount(), 0);
});

test('google with an invalid ID token is rejected', async () => {
  mock.method(GoogleHelper, 'validateIdToken', async () => null);
  const result = await provider.signinOAuth('google', {
    email: 'victim@example.test',
    authentication: { idToken: 'bad' },
  });
  assert.deepEqual(result, { error: 'Invalid Google ID token' });
  assert.equal(login.mock.callCount(), 0);
});

test('apple signs in with the email from the verified identity token, not the client', async () => {
  const decode = mock.method(AppleHelper, 'decodeIdentityToken', async () => ({
    email: 'ada@example.test',
    sub: '001234.abcdef.0001',
  }));
  const result = await provider.signinOAuth('apple', {
    email: 'victim@example.test',
    identityToken: 'apple-identity-token',
  });
  assert.equal(decode.mock.calls[0].arguments[0], 'apple-identity-token');
  assert.deepEqual(loginLabels(), ['apple OAuth']);
  assert.equal(await lookedUpWebID(), emailToWebID('ada@example.test'));
  assert.equal(result, SIGNED_IN);
});

test('apple without an identity token is rejected', async () => {
  const result = await provider.signinOAuth('apple', { email: 'victim@example.test' });
  assert.deepEqual(result, { error: 'No Apple identity token provided' });
  assert.equal(login.mock.callCount(), 0);
});

test('apple with an invalid identity token is rejected', async () => {
  mock.method(AppleHelper, 'decodeIdentityToken', async () => null);
  const result = await provider.signinOAuth('apple', {
    email: 'victim@example.test',
    identityToken: 'bad',
  });
  assert.deepEqual(result, { error: 'Invalid Apple identity token' });
  assert.equal(login.mock.callCount(), 0);
});
