import { Shape } from '@_linked/core/shapes/Shape';
import { linkedShape } from '../package.js';
import { auth } from '../ontologies/auth.js';
import { UserAccount } from '@_linked/sioc/shapes/UserAccount';
import { literalProperty, objectProperty } from '@_linked/core/shapes/SHACL';
import { xsd } from '@_linked/core/ontologies/xsd';

/**
 * One issued refresh token, stored server-side so it can be validated, rotated and revoked.
 *
 * Only the SHA-256 hash of the token is stored — the raw token lives on the client alone, so
 * reading the store does not yield usable tokens. Every refresh replaces the token with a new
 * one in the same session (`sessionId`), marking the old one revoked with `replacedBy`.
 * Presenting a replaced token again (outside a short grace window) revokes the whole session.
 *
 * This module stays free of server-only imports (it is part of the client bundle); the logic
 * that reads and writes these records lives in `utils/sessions.ts`.
 */
@linkedShape
export class RefreshToken extends Shape {
  static targetClass = auth.RefreshToken;

  /** SHA-256 of the raw refresh token, base64url. */
  @literalProperty({
    path: auth.tokenHash,
    maxCount: 1,
  })
  get tokenHash(): string {
    return '';
  }

  /** The sign-in session (token family) this token belongs to. Shared by every rotation. */
  @literalProperty({
    path: auth.sessionId,
    maxCount: 1,
  })
  get sessionId(): string {
    return '';
  }

  @objectProperty({
    path: auth.account,
    shape: UserAccount,
    maxCount: 1,
  })
  get account(): UserAccount {
    return undefined as any;
  }

  @literalProperty({
    path: auth.createdAt,
    datatype: xsd.dateTime,
    maxCount: 1,
  })
  get createdAt(): Date {
    return undefined as any;
  }

  @literalProperty({
    path: auth.lastUsedAt,
    datatype: xsd.dateTime,
    maxCount: 1,
  })
  get lastUsedAt(): Date {
    return undefined as any;
  }

  @literalProperty({
    path: auth.expiresAt,
    datatype: xsd.dateTime,
    maxCount: 1,
  })
  get expiresAt(): Date {
    return undefined as any;
  }

  /** Set when the token was rotated, signed out or otherwise revoked. */
  @literalProperty({
    path: auth.revokedAt,
    datatype: xsd.dateTime,
    maxCount: 1,
  })
  get revokedAt(): Date {
    return undefined as any;
  }

  /** The `tokenHash` of the token that replaced this one when it was rotated. */
  @literalProperty({
    path: auth.replacedBy,
    maxCount: 1,
  })
  get replacedBy(): string {
    return '';
  }
}
