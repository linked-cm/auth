import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isOAuthProvider,
  OAUTH_PROVIDERS,
} from '../lib/esm/types/auth.js';
import { isCleanName } from '../lib/esm/utils/name-validation.js';
import {
  isAcceptableNewPassword,
  isCheckablePassword,
} from '../lib/esm/utils/password-policy.js';
import {
  getOwnCallableLevel,
  isDeclaredInternal,
} from '@_linked/server-utils/utils/callable';
import AuthBackendProvider from '../lib/esm/backend.js';
import { AuthCredentialProvider } from '../lib/esm/shapes/AuthCredentialProvider.js';

test('client-facing auth RPCs declare their required exposure', () => {
  for (const method of [
    'createAccount',
    'resetPassword',
    'sendResetPasswordLink',
    'signinDev',
    'signinOAuth',
    'signinTemporary',
    'signinWithPassword',
    'signout',
    'validateToken',
  ]) {
    assert.equal(getOwnCallableLevel(AuthBackendProvider, method), 'public', method);
  }
  for (const method of ['linkOAuthIdentity', 'removeAccount']) {
    assert.equal(getOwnCallableLevel(AuthBackendProvider, method), 'user', method);
  }
  for (const method of ['userHasAuthCredential', 'userHasPassword']) {
    assert.equal(getOwnCallableLevel(AuthCredentialProvider, method), 'user', method);
  }
});

test('auth implementation helpers are never exposed over RPC', () => {
  for (const method of [
    'checkSignin',
    'getOrCreateAccount',
    'getPasswordForUser',
    'getPasswordsForUser',
    'getRefreshTokenFromRequest',
    'getTokenCandidates',
    'getTokenFromRequest',
    'validateRequestToken',
  ]) {
    assert.equal(isDeclaredInternal(AuthBackendProvider, method), true, method);
  }
  for (const method of [
    'createNewCredential',
    'hasAuthCredential',
    'hasPassword',
  ]) {
    assert.equal(isDeclaredInternal(AuthCredentialProvider, method), true, method);
  }
});

test('OAuth provider runtime guard accepts only supported providers', () => {
  assert.deepEqual(OAUTH_PROVIDERS, ['facebook', 'google', 'apple']);
  assert.equal(isOAuthProvider('google'), true);
  assert.equal(isOAuthProvider('apple'), true);
  assert.equal(isOAuthProvider('facebook'), true);
  assert.equal(isOAuthProvider('custom'), false);
  assert.equal(isOAuthProvider(undefined), false);
});

test('name validation rejects profanity and preserves explicit name allowlist', () => {
  assert.equal(isCleanName('Friendly'), true);
  assert.equal(isCleanName('shit'), false);
  assert.equal(isCleanName('Dick'), true);
});

test('an empty or non-string password is never checked against a hash', () => {
  for (const value of ['', undefined, null, 0, [], {}]) {
    assert.equal(isCheckablePassword(value), false, JSON.stringify(value));
  }
  assert.equal(isCheckablePassword('a'), true);
});

test('a new password must be a string of at least six characters', () => {
  assert.equal(isAcceptableNewPassword('12345'), false);
  assert.equal(isAcceptableNewPassword(123456), false);
  assert.equal(isAcceptableNewPassword('123456'), true);
});

test('password sign-in refuses an unusable password before looking anything up', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(
    new URL('../lib/esm/backend.js', import.meta.url),
    'utf8'
  );
  const signin = source.slice(source.indexOf('async signinWithPassword('));
  assert.ok(
    signin.indexOf('isCheckablePassword(plainPassword)') <
      signin.indexOf('emailToWebID('),
  );
});
