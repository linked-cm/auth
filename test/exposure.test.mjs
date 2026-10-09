// Which provider methods the server may dispatch over HTTP. Methods declared internal answer
// 501 on `/call/...` in every exposure mode; backend code can still call them.
//
// Runs against the BUILT package in lib/ (build first: `npx linked build`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = 'https://app.test';
process.env.JWT_SECRET = 'unit-test-secret-unit-test-secret';
process.env.SESSION_SECRET = 'unit-test-session-secret';
process.env.AUTH_SESSION_CLEANUP = 'false';

// connect-sqlite3 (express-session store) writes into <cwd>/data
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'linked-auth-test-'));
fs.mkdirSync(path.join(workDir, 'data'));
process.chdir(workDir);
process.on('exit', () => fs.rmSync(workDir, { recursive: true, force: true }));

const libDir = new URL('../lib/esm/', import.meta.url);
const { default: AuthBackendProvider } = await import(new URL('backend.js', libDir));
const { AuthCredentialProvider } = await import(
  new URL('shapes/AuthCredentialProvider.js', libDir)
);
const { isDeclaredInternal } = await import('@_linked/server-utils/utils/callable');

const BACKEND_INTERNAL = [
  'upgradePasswordHash',
  'getPasswordForUser',
  'getOrCreateAccount',
  'loadAccountForSession',
  'loadUserForSession',
];

// What auth's own frontend calls: these must stay dispatchable.
const BACKEND_CALLED_BY_THE_FRONTEND = [
  'signinWithPassword',
  'createAccount',
  'signinOAuth',
  'signinTemporary',
  'signinDev',
  'sendResetPasswordLink',
  'resetPassword',
  'validateToken',
  'signout',
  'removeAccount',
  'linkOAuthIdentity',
];

for (const method of BACKEND_INTERNAL) {
  test(`AuthBackendProvider.${method} is internal`, () => {
    assert.equal(typeof AuthBackendProvider.prototype[method], 'function');
    assert.equal(isDeclaredInternal(AuthBackendProvider, method), true);
  });
}

test('an override in a subclass stays internal', () => {
  class AppAuthProvider extends AuthBackendProvider {
    async upgradePasswordHash() {}
  }
  assert.equal(isDeclaredInternal(AppAuthProvider, 'upgradePasswordHash'), true);
});

test('AuthCredentialProvider.createNewCredential is internal', () => {
  assert.equal(isDeclaredInternal(AuthCredentialProvider, 'createNewCredential'), true);
});

test('the methods the frontend calls are not internal', () => {
  for (const method of BACKEND_CALLED_BY_THE_FRONTEND) {
    assert.equal(typeof AuthBackendProvider.prototype[method], 'function', method);
    assert.equal(isDeclaredInternal(AuthBackendProvider, method), false, method);
  }
  assert.equal(isDeclaredInternal(AuthCredentialProvider, 'userHasAuthCredential'), false);
  assert.equal(typeof AuthCredentialProvider.prototype.userHasPassword, 'function');
  assert.equal(isDeclaredInternal(AuthCredentialProvider, 'userHasPassword'), false);
});

test('the OAuth account helpers are not provider methods', () => {
  // every provider method can be dispatched over /call; these act on any identity or account
  for (const name of ['verifyOAuthIdentity', 'findLinks', 'createLink', 'findLinkedProviders',
    'personHasPassword', 'upgradeLegacyLink', 'loadAccountWithPerson', 'findAccountForWebID']) {
    assert.equal(AuthBackendProvider.prototype[name], undefined, name);
    assert.equal(AuthCredentialProvider.prototype[name], undefined, name);
  }
});
