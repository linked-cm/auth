/**
 * Stored, rotating refresh tokens (server-only).
 *
 * A sign-in creates a SESSION (a token family, identified by `sessionId`) and an opaque refresh
 * token. Only the token's SHA-256 hash is stored. Each refresh:
 *  - looks the token up by hash and rejects it if it is unknown, revoked or expired;
 *  - replaces it with a new token in the same session (the old record gets `revokedAt` and
 *    `replacedBy`).
 * Presenting a token that was already replaced means two parties hold the same token, so the
 * whole session is revoked — unless it happens within REFRESH_REUSE_GRACE_MS of the rotation and
 * the session is still alive, which is what two tabs refreshing at once look like. In that case
 * the caller gets a new access token but no new refresh token (see `rotateRefreshToken`).
 *
 * Signing out revokes the session; a password reset revokes every session of the account; removing
 * the account deletes its records.
 */
import crypto from 'node:crypto';
import { RefreshToken } from '../shapes/RefreshToken.js';
import { REFRESH_TOKEN_EXPIRES } from './token.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  looksLikeOpaqueRefreshToken,
} from './refreshTokenHash.js';

export { generateRefreshToken, hashRefreshToken };

/** How long after a rotation the replaced token is still tolerated (concurrent tabs). */
export const REFRESH_REUSE_GRACE_MS = 30 * 1000;

export interface RefreshSessionRecord {
  /** The store's identifier of the record (graph node IRI). */
  id?: string;
  tokenHash: string;
  sessionId: string;
  accountId: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: string;
}

/**
 * Where refresh token records live. The default stores them as `RefreshToken` shapes through
 * the app's configured storage; tests can swap in `MemoryRefreshSessionStore`.
 */
export interface RefreshSessionStore {
  create(record: RefreshSessionRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null>;
  findBySessionId(sessionId: string): Promise<RefreshSessionRecord[]>;
  findByAccount(accountId: string): Promise<RefreshSessionRecord[]>;
  update(
    record: RefreshSessionRecord,
    patch: Partial<Pick<RefreshSessionRecord, 'lastUsedAt' | 'revokedAt' | 'replacedBy'>>
  ): Promise<void>;
  delete(record: RefreshSessionRecord): Promise<void>;
}

function toDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value as any);
  return isNaN(date.getTime()) ? undefined : date;
}

function idOf(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.id;
}

/** Stores refresh token records as `RefreshToken` shapes in the app's storage. */
export class GraphRefreshSessionStore implements RefreshSessionStore {
  private static select() {
    return RefreshToken.select((t) => [
      t.tokenHash,
      t.sessionId,
      t.account,
      t.createdAt,
      t.lastUsedAt,
      t.expiresAt,
      t.revokedAt,
      t.replacedBy,
    ]);
  }

  private static toRecord(row: any): RefreshSessionRecord | null {
    if (!row || !row.tokenHash) return null;
    return {
      id: row.id,
      tokenHash: row.tokenHash,
      sessionId: row.sessionId,
      accountId: idOf(row.account),
      createdAt: toDate(row.createdAt),
      lastUsedAt: toDate(row.lastUsedAt),
      expiresAt: toDate(row.expiresAt),
      revokedAt: toDate(row.revokedAt),
      replacedBy: row.replacedBy || undefined,
    };
  }

  async create(record: RefreshSessionRecord): Promise<void> {
    const created = await RefreshToken.create({
      tokenHash: record.tokenHash,
      sessionId: record.sessionId,
      account: { id: record.accountId },
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      ...(record.lastUsedAt ? { lastUsedAt: record.lastUsedAt } : {}),
    });
    record.id = created?.id;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSessionRecord | null> {
    const rows = await GraphRefreshSessionStore.select().where((t) =>
      t.tokenHash.equals(tokenHash)
    );
    return GraphRefreshSessionStore.toRecord(rows?.[0]);
  }

  async findBySessionId(sessionId: string): Promise<RefreshSessionRecord[]> {
    const rows = await GraphRefreshSessionStore.select().where((t) =>
      t.sessionId.equals(sessionId)
    );
    return (rows || []).map(GraphRefreshSessionStore.toRecord).filter(Boolean);
  }

  async findByAccount(accountId: string): Promise<RefreshSessionRecord[]> {
    const rows = await GraphRefreshSessionStore.select().where((t) =>
      t.account.equals({ id: accountId })
    );
    return (rows || []).map(GraphRefreshSessionStore.toRecord).filter(Boolean);
  }

  async update(
    record: RefreshSessionRecord,
    patch: Partial<Pick<RefreshSessionRecord, 'lastUsedAt' | 'revokedAt' | 'replacedBy'>>
  ): Promise<void> {
    const id = record.id ?? (await this.findByTokenHash(record.tokenHash))?.id;
    if (!id) return;
    const data: Partial<Pick<RefreshSessionRecord, 'lastUsedAt' | 'revokedAt' | 'replacedBy'>> = {};
    if (patch.lastUsedAt !== undefined) data.lastUsedAt = patch.lastUsedAt;
    if (patch.revokedAt !== undefined) data.revokedAt = patch.revokedAt;
    if (patch.replacedBy !== undefined) data.replacedBy = patch.replacedBy;
    if (Object.keys(data).length === 0) return;
    await RefreshToken.update(data).for({ id });
    Object.assign(record, patch);
  }

  async delete(record: RefreshSessionRecord): Promise<void> {
    const id = record.id ?? (await this.findByTokenHash(record.tokenHash))?.id;
    if (!id) return;
    await RefreshToken.delete({ id });
  }
}

/** Keeps refresh token records in memory. For tests and single-process tooling only. */
export class MemoryRefreshSessionStore implements RefreshSessionStore {
  readonly records = new Map<string, RefreshSessionRecord>();

  async create(record: RefreshSessionRecord): Promise<void> {
    record.id = record.id ?? `memory:${record.tokenHash}`;
    this.records.set(record.tokenHash, { ...record });
  }
  async findByTokenHash(tokenHash: string) {
    const record = this.records.get(tokenHash);
    return record ? { ...record } : null;
  }
  async findBySessionId(sessionId: string) {
    return [...this.records.values()]
      .filter((r) => r.sessionId === sessionId)
      .map((r) => ({ ...r }));
  }
  async findByAccount(accountId: string) {
    return [...this.records.values()]
      .filter((r) => r.accountId === accountId)
      .map((r) => ({ ...r }));
  }
  async update(record: RefreshSessionRecord, patch: Partial<RefreshSessionRecord>) {
    const stored = this.records.get(record.tokenHash);
    if (stored) Object.assign(stored, patch);
    Object.assign(record, patch);
  }
  async delete(record: RefreshSessionRecord) {
    this.records.delete(record.tokenHash);
  }
}

let store: RefreshSessionStore = new GraphRefreshSessionStore();

/** Replace where refresh token records are kept (defaults to the graph via `RefreshToken`). */
export function setRefreshSessionStore(newStore: RefreshSessionStore) {
  store = newStore;
}
export function getRefreshSessionStore(): RefreshSessionStore {
  return store;
}

/** A new session identifier (the token family shared by every rotation of one sign-in). */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Store a new refresh token for an account and return the raw token.
 * Starts a new session unless `sessionId` is given.
 */
export async function issueRefreshToken(
  accountId: string,
  sessionId: string = generateSessionId(),
  now: Date = new Date()
): Promise<{ refreshToken: string; sessionId: string; expiresAt: Date }> {
  if (!accountId) {
    throw new Error('@_linked/auth: cannot issue a refresh token without an account id');
  }
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRES * 1000);
  await store.create({
    tokenHash: hashRefreshToken(refreshToken),
    sessionId,
    accountId,
    createdAt: now,
    lastUsedAt: now,
    expiresAt,
  });
  return { refreshToken, sessionId, expiresAt };
}

export type RotateResult =
  | {
      ok: true;
      accountId: string;
      sessionId: string;
      /** The replacement token. Absent on a grace-window reuse: the caller keeps the token it has. */
      refreshToken?: string;
    }
  | {
      ok: false;
      reason: 'malformed' | 'unknown' | 'expired' | 'revoked' | 'reused';
    };

function isActive(record: RefreshSessionRecord, now: Date) {
  return !record.revokedAt && record.expiresAt && record.expiresAt > now;
}

/**
 * Is the session that `record` was rotated out of still alive? Follows `replacedBy` to the
 * newest token, tolerating a chain of rotations that all happened within the grace window.
 */
async function successorIsAlive(record: RefreshSessionRecord, now: Date) {
  let current = record;
  for (let i = 0; i < 5; i++) {
    if (!current.replacedBy) return false;
    const next = await store.findByTokenHash(current.replacedBy);
    if (!next || next.sessionId !== record.sessionId) return false;
    if (isActive(next, now)) return true;
    if (
      !next.replacedBy ||
      !next.revokedAt ||
      now.getTime() - next.revokedAt.getTime() > REFRESH_REUSE_GRACE_MS
    ) {
      return false;
    }
    current = next;
  }
  return false;
}

const inFlight = new Map<string, Promise<RotateResult>>();

/**
 * Validate a raw refresh token and replace it with a new one in the same session.
 * See the module comment for the reuse and grace-window rules.
 */
export function rotateRefreshToken(
  rawToken: string,
  now: Date = new Date()
): Promise<RotateResult> {
  if (!looksLikeOpaqueRefreshToken(rawToken)) {
    // Includes every refresh token issued before tokens were stored (those were JWTs).
    return Promise.resolve({ ok: false, reason: 'malformed' });
  }
  const tokenHash = hashRefreshToken(rawToken);
  // Two requests in this process presenting the same token: the second one waits for the
  // first and is then treated as a grace-window reuse rather than a theft.
  const pending = inFlight.get(tokenHash);
  if (pending) {
    return pending.then(() => doRotate(tokenHash, now));
  }
  const promise = doRotate(tokenHash, now).finally(() => inFlight.delete(tokenHash));
  inFlight.set(tokenHash, promise);
  return promise;
}

async function doRotate(tokenHash: string, now: Date): Promise<RotateResult> {
  const record = await store.findByTokenHash(tokenHash);
  if (!record) {
    return { ok: false, reason: 'unknown' };
  }

  if (record.revokedAt) {
    const sinceRevoked = now.getTime() - record.revokedAt.getTime();
    if (record.replacedBy && sinceRevoked <= REFRESH_REUSE_GRACE_MS) {
      if (await successorIsAlive(record, now)) {
        return {
          ok: true,
          accountId: record.accountId,
          sessionId: record.sessionId,
        };
      }
      return { ok: false, reason: 'revoked' };
    }
    if (record.replacedBy) {
      // A replaced token presented again: someone else has (had) it. End the session.
      console.warn(
        `@_linked/auth: refresh token reuse detected, revoking session ${record.sessionId}`
      );
      await revokeSession(record.sessionId, now);
      return { ok: false, reason: 'reused' };
    }
    return { ok: false, reason: 'revoked' };
  }

  if (!record.expiresAt || record.expiresAt <= now) {
    return { ok: false, reason: 'expired' };
  }

  // Create the replacement first: if revoking the old record fails, the user keeps a working
  // session rather than losing it.
  const next = await issueRefreshToken(record.accountId, record.sessionId, now);
  await store.update(record, {
    revokedAt: now,
    replacedBy: hashRefreshToken(next.refreshToken),
    lastUsedAt: now,
  });
  return {
    ok: true,
    accountId: record.accountId,
    sessionId: record.sessionId,
    refreshToken: next.refreshToken,
  };
}

/** The session a raw refresh token belongs to, if it is known. Does not validate it. */
export async function findSessionIdForRefreshToken(
  rawToken: string
): Promise<string | undefined> {
  if (!looksLikeOpaqueRefreshToken(rawToken)) return undefined;
  const record = await store.findByTokenHash(hashRefreshToken(rawToken));
  return record?.sessionId;
}

/** Revoke every token of one session (sign-out, or detected reuse). Returns how many were revoked. */
export async function revokeSession(
  sessionId: string,
  now: Date = new Date()
): Promise<number> {
  if (!sessionId) return 0;
  const records = await store.findBySessionId(sessionId);
  let revoked = 0;
  for (const record of records) {
    if (!record.revokedAt) {
      await store.update(record, { revokedAt: now });
      revoked++;
    }
  }
  return revoked;
}

/** Revoke every session of an account (password reset / change). Returns how many tokens were revoked. */
export async function revokeAllSessionsForAccount(
  accountId: string,
  now: Date = new Date()
): Promise<number> {
  if (!accountId) return 0;
  const records = await store.findByAccount(accountId);
  let revoked = 0;
  for (const record of records) {
    if (!record.revokedAt) {
      await store.update(record, { revokedAt: now });
      revoked++;
    }
  }
  return revoked;
}

/** Delete every refresh token record of an account (account removal). */
export async function deleteAllSessionsForAccount(accountId: string): Promise<number> {
  if (!accountId) return 0;
  const records = await store.findByAccount(accountId);
  for (const record of records) {
    await store.delete(record);
  }
  return records.length;
}
