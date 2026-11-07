import { verifyToken as clerkVerifyToken } from '@clerk/backend';
import type { Authenticator } from './auth';

export type ClerkSellerClaim = 'org_slug' | 'org_id' | 'sub';

export interface ClerkTokenVerifierOptions {
  secretKey: string;
  authorizedParties?: string[];
}

export type ClerkTokenVerifier = (
  token: string,
  options: ClerkTokenVerifierOptions,
) => Promise<Record<string, unknown>>;

export interface ClerkAuthenticatorOptions {
  secretKey: string;
  authorizedParties?: string[];
  /**
   * Clerk claim used as the seller_id. Organization slug is the default because
   * it can match the human-readable seller_id in uploaded CSVs (case-insensitive
   * in the engine). Use `sub` for personal accounts.
   */
  sellerClaim?: ClerkSellerClaim;
  /** Injectable for tests; defaults to Clerk's verifyToken(). */
  verifyToken?: ClerkTokenVerifier;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function compactOrgClaim(claims: Record<string, unknown>, key: 'id' | 'slg'): string | null {
  const org = claims.o;
  if (org === null || typeof org !== 'object' || Array.isArray(org)) return null;
  return nonEmptyString((org as Record<string, unknown>)[key]);
}

function sellerFromClaims(
  claims: Record<string, unknown>,
  claim: ClerkSellerClaim,
): string | null {
  if (claim === 'sub') return nonEmptyString(claims.sub);
  if (claim === 'org_id') {
    return nonEmptyString(claims.org_id) ?? compactOrgClaim(claims, 'id');
  }
  return nonEmptyString(claims.org_slug) ?? compactOrgClaim(claims, 'slg');
}

/**
 * Authenticates `Authorization: Bearer <Clerk session token>` requests.
 * The seller id always comes from a verified claim, never from a form field.
 */
export function createClerkAuthenticator(options: ClerkAuthenticatorOptions): Authenticator {
  if (!options.secretKey.trim()) {
    throw new Error('CLERK_SECRET_KEY is required for Clerk authentication');
  }

  const verify: ClerkTokenVerifier =
    options.verifyToken ??
    (async (token, verifyOptions) =>
      (await clerkVerifyToken(token, verifyOptions)) as unknown as Record<string, unknown>);

  const sellerClaim = options.sellerClaim ?? 'org_slug';

  return async (request) => {
    const authorization = request.headers.get('authorization');
    if (!authorization) return null;

    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    if (!match) return null;

    try {
      const claims = await verify(match[1], {
        secretKey: options.secretKey,
        authorizedParties: options.authorizedParties,
      });
      const sellerId = sellerFromClaims(claims, sellerClaim);
      if (!sellerId) return null;

      const userId = nonEmptyString(claims.sub);
      return {
        seller_id: sellerId,
        ...(userId ? { user_id: userId } : {}),
      };
    } catch {
      return null;
    }
  };
}
