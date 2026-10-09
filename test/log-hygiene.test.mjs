// Sign-in must never write credentials (ID tokens, identity tokens) or email addresses to the log.
//
// Runs against the BUILT package in lib/ (build first: `npx linked build`). No network and no
// store: the provider helpers and `Auth.login` are stubbed.
import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = 'https://app.test';
process.env.JWT_SECRET = 'unit-test-secret-unit-test-secret';
process.env.SESSION_SECRET = 'unit-test-session-secret';
process.env.AUTH_SESSION_CLEANUP = 'false';

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linked-auth-test-'));
fs.mkdirSync(path.join(workDir, 'data'));
process.chdir(workDir);
process.on('exit', () => fs.rmSync(workDir, { recursive: true, force: true }));

const libDir = new URL('../lib/esm/', import.meta.url);
const { Auth } = await import(new URL('utils/auth.js', libDir));
const { default: AppleHelper } = await import(new URL('helpers/apple.js', libDir));
const { default: GoogleHelper } = await import(new URL('helpers/google.js', libDir));
const { default: AuthBackendProvider } = await import(new URL('backend.js', libDir));
const { OAuth2Client } = await import('google-auth-library');

const fakeLincdServer = { callGenericBackendProvidersMethod: async () => {} };
const FAKE_JWT = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzZWNyZXQtc3ViIn0.c2lnbmF0dXJl';
const EMAIL = 'ada@example.test';

let logged;

beforeEach(() => {
  logged = [];
  for (const level of ['log', 'warn', 'error', 'info', 'debug']) {
    mock.method(console, level, (...args) => {
      logged.push(
        args
          .map((arg) =>
            arg instanceof Error
              ? `${arg.message}\n${arg.stack}`
              : typeof arg === 'string'
                ? arg
                : JSON.stringify(arg)
          )
          .join(' ')
      );
    });
  }
});

afterEach(() => {
  mock.restoreAll();
  delete process.env.GOOGLE_CLIENT_ID;
});

const allLogs = () => logged.join('\n');

test('a rejected Google ID token is not written to the log', async () => {
  process.env.GOOGLE_CLIENT_ID = 'web-client-id';
  // google-auth-library puts the raw token (or its decoded payload) into its error messages
  mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => {
    throw new Error('Invalid token signature: ' + FAKE_JWT);
  });
  const result = await GoogleHelper.validateIdToken(FAKE_JWT);
  assert.equal(result, null);
  assert.ok(!allLogs().includes(FAKE_JWT), `the token was logged:\n${allLogs()}`);
  assert.ok(!allLogs().includes('c2lnbmF0dXJl'), `part of the token was logged:\n${allLogs()}`);
});

test('a Google token whose payload is rejected does not log the payload', async () => {
  process.env.GOOGLE_CLIENT_ID = 'web-client-id';
  mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => {
    throw new Error('No expiration time in token: ' + JSON.stringify({ email: EMAIL }));
  });
  assert.equal(await GoogleHelper.validateIdToken(FAKE_JWT), null);
  assert.ok(!allLogs().includes(EMAIL), `the payload was logged:\n${allLogs()}`);
});

test('an Apple sign-in without an email does not log the identity token', async () => {
  const provider = new AuthBackendProvider(null, fakeLincdServer);
  mock.method(Auth, 'login', async () => ({ error: 'stubbed' }));
  mock.method(AppleHelper, 'decodeIdentityToken', async () => ({ sub: 'apple-sub', email: undefined }));
  await provider.signinOAuth('apple', { identityToken: FAKE_JWT, givenName: 'Ada' });
  assert.ok(!allLogs().includes(FAKE_JWT), `the identity token was logged:\n${allLogs()}`);
});

test('a Google sign-in does not log the email or the ID token', async () => {
  const provider = new AuthBackendProvider(null, fakeLincdServer);
  mock.method(Auth, 'login', async () => ({ error: 'stubbed' }));
  mock.method(GoogleHelper, 'validateIdToken', async () => ({
    sub: 'g-1',
    email: EMAIL,
    email_verified: true,
  }));
  await provider.signinOAuth('google', { authentication: { idToken: FAKE_JWT } });
  assert.ok(!allLogs().includes(EMAIL), `the email was logged:\n${allLogs()}`);
  assert.ok(!allLogs().includes(FAKE_JWT), `the ID token was logged:\n${allLogs()}`);
});

test('an Apple sign-in does not log the email', async () => {
  const provider = new AuthBackendProvider(null, fakeLincdServer);
  mock.method(Auth, 'login', async () => ({ error: 'stubbed' }));
  mock.method(AppleHelper, 'decodeIdentityToken', async () => ({ sub: 'apple-sub', email: EMAIL }));
  await provider.signinOAuth('apple', { identityToken: FAKE_JWT });
  assert.ok(!allLogs().includes(EMAIL), `the email was logged:\n${allLogs()}`);
});
