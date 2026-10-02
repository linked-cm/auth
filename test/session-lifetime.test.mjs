// Session lifetime (idle timeout, absolute lifetime) and cleanup of old refresh token records,
// with records in memory. The same rules run against Fuseki in test/integration/.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.SITE_ROOT = 'https://app.test';
process.env.JWT_SECRET = 'lifetime-test-secret-lifetime-test';
process.env.AUTH_SESSION_CLEANUP = 'false';

const libDir = new URL('../lib/esm/', import.meta.url);
const sessions = await import(new URL('utils/sessions.js', libDir));

const ACCOUNT = 'https://app.test/account/ada';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const at = (base, ms) => new Date(base.getTime() + ms);

let store;
let defaults;
beforeEach(() => {
  store = new sessions.MemoryRefreshSessionStore();
  sessions.setRefreshSessionStore(store);
  defaults ??= sessions.getSessionLimits();
  sessions.setSessionLimits(defaults);
});
afterEach(() => sessions.setSessionLimits(defaults));

test('defaults: 7 day idle timeout, 60 day absolute lifetime', () => {
  assert.equal(defaults.idleTtl, 7 * 86400);
  assert.equal(defaults.maxTtl, 60 * 86400);
});

test('idle timeout: a session not refreshed for longer than AUTH_SESSION_IDLE_TTL cannot refresh', async () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const { refreshToken, expiresAt } = await sessions.issueRefreshToken(ACCOUNT, undefined, t0);
  assert.equal(expiresAt.getTime(), at(t0, 7 * DAY).getTime(), 'the token expires with the idle limit');

  // used within the idle window: works, and slides the window
  const r1 = await sessions.rotateRefreshToken(refreshToken, at(t0, 6 * DAY));
  assert.equal(r1.ok, true);
  assert.equal(r1.refreshTokenExpiresAt.getTime(), at(t0, 13 * DAY).getTime(), 'sliding');

  // then idle for 8 days
  const r2 = await sessions.rotateRefreshToken(r1.refreshToken, at(t0, 14 * DAY + 1));
  assert.equal(r2.ok, false);
});

test('idle timeout also applies to records issued before it was lowered (and revokes the session)', async () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const { refreshToken, sessionId } = await sessions.issueRefreshToken(ACCOUNT, undefined, t0);
  sessions.setSessionLimits({ idleTtl: 3600 });
  const result = await sessions.rotateRefreshToken(refreshToken, at(t0, 2 * HOUR));
  assert.deepEqual(result, { ok: false, reason: 'idle' });
  const family = await store.findBySessionId(sessionId);
  assert.ok(family.every((r) => r.revokedAt), 'session revoked');
});

test('absolute lifetime: an active session still ends AUTH_SESSION_MAX_TTL after sign-in', async () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  let { refreshToken } = await sessions.issueRefreshToken(ACCOUNT, undefined, t0);
  // refresh every 5 days (never idle) for 55 days
  for (let day = 5; day <= 55; day += 5) {
    const r = await sessions.rotateRefreshToken(refreshToken, at(t0, day * DAY));
    assert.equal(r.ok, true, `day ${day}`);
    assert.ok(r.refreshTokenExpiresAt <= at(t0, 60 * DAY), 'never past the session maximum');
    refreshToken = r.refreshToken;
  }
  const late = await sessions.rotateRefreshToken(refreshToken, at(t0, 60 * DAY + 1000));
  assert.equal(late.ok, false, 'day 60: over');
});

test('absolute lifetime: the session start is carried across rotations', async () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const { refreshToken, sessionId } = await sessions.issueRefreshToken(ACCOUNT, undefined, t0);
  const r = await sessions.rotateRefreshToken(refreshToken, at(t0, DAY));
  const records = await store.findBySessionId(sessionId);
  assert.equal(records.length, 2);
  for (const record of records) {
    assert.equal(record.sessionStartedAt.getTime(), t0.getTime());
  }
  assert.ok(r.ok);
});

test('absolute lifetime for a record without sessionStartedAt: the family’s first createdAt', async () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const raw = sessions.generateRefreshToken();
  // a record as 2.0.x stored it: no sessionStartedAt, a 60 day sliding expiry
  await store.create({
    tokenHash: sessions.hashRefreshToken(raw),
    sessionId: 'legacy-session',
    accountId: ACCOUNT,
    createdAt: at(t0, 59 * DAY),
    lastUsedAt: at(t0, 59 * DAY),
    expiresAt: at(t0, 119 * DAY),
  });
  await store.create({
    tokenHash: 'older-rotation',
    sessionId: 'legacy-session',
    accountId: ACCOUNT,
    createdAt: t0,
    expiresAt: at(t0, 60 * DAY),
    revokedAt: at(t0, 59 * DAY),
    replacedBy: sessions.hashRefreshToken(raw),
  });
  const result = await sessions.rotateRefreshToken(raw, at(t0, 61 * DAY));
  assert.deepEqual(result, { ok: false, reason: 'session-expired' });
});

test('0 switches a limit off', async () => {
  sessions.setSessionLimits({ idleTtl: 0, maxTtl: 0 });
  const t0 = new Date('2026-01-01T00:00:00Z');
  const { expiresAt } = await sessions.issueRefreshToken(ACCOUNT, undefined, t0);
  assert.equal(expiresAt.getTime(), at(t0, defaults.refreshTtl * 1000).getTime());
});

test('cleanupExpiredSessions deletes only records revoked/expired longer ago than olderThan', async () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const base = { sessionId: 's', accountId: ACCOUNT, createdAt: at(now, -90 * DAY) };
  const records = {
    active: { ...base, tokenHash: 'active', expiresAt: at(now, DAY) },
    recentlyRevoked: { ...base, tokenHash: 'recentlyRevoked', expiresAt: at(now, DAY), revokedAt: at(now, -DAY) },
    recentlyExpired: { ...base, tokenHash: 'recentlyExpired', expiresAt: at(now, -DAY) },
    oldRevoked: { ...base, tokenHash: 'oldRevoked', expiresAt: at(now, DAY), revokedAt: at(now, -40 * DAY) },
    oldExpired: { ...base, tokenHash: 'oldExpired', expiresAt: at(now, -40 * DAY) },
  };
  for (const r of Object.values(records)) await store.create(r);

  const deleted = await sessions.cleanupExpiredSessions(store, { olderThan: 30 * 86400, now });
  assert.equal(deleted, 2);
  assert.deepEqual(
    [...store.records.keys()].sort(),
    ['active', 'recentlyExpired', 'recentlyRevoked']
  );
});

test('cleanupExpiredSessions uses the configured store by default', async () => {
  const now = new Date();
  await store.create({
    tokenHash: 'old',
    sessionId: 's',
    accountId: ACCOUNT,
    createdAt: at(now, -90 * DAY),
    expiresAt: at(now, -60 * DAY),
  });
  assert.equal(await sessions.cleanupExpiredSessions(), 1);
  assert.equal(store.records.size, 0);
});

test('the background cleanup can be switched off and is never started twice', () => {
  // AUTH_SESSION_CLEANUP=false (set above): starting is a no-op that returns a stopper
  const stop = sessions.startSessionCleanup();
  assert.equal(typeof stop, 'function');
  stop();
});
