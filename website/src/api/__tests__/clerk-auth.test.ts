import { describe, expect, it } from 'vitest';
import { createClerkAuthenticator, type ClerkTokenVerifier } from '../clerk-auth';

function request(authorization?: string): Request {
  const headers = new Headers();
  if (authorization) headers.set('authorization', authorization);
  return new Request('http://localhost/api/analyses', { headers });
}

describe('createClerkAuthenticator', () => {
  it('uses the organisation slug as the seller id', async () => {
    const verifyToken: ClerkTokenVerifier = async () => ({
      sub: 'user_123',
      org_slug: 'seller-demo',
    });
    const authenticate = createClerkAuthenticator({
      secretKey: 'sk_test',
      verifyToken,
    });

    await expect(authenticate(request('Bearer session-token'))).resolves.toEqual({
      seller_id: 'seller-demo',
      user_id: 'user_123',
    });
  });

  it('supports compact organisation claims', async () => {
    const verifyToken: ClerkTokenVerifier = async () => ({
      sub: 'user_123',
      o: { id: 'org_123', slg: 'seller-demo' },
    });
    const authenticate = createClerkAuthenticator({
      secretKey: 'sk_test',
      verifyToken,
    });

    await expect(authenticate(request('Bearer session-token'))).resolves.toEqual({
      seller_id: 'seller-demo',
      user_id: 'user_123',
    });
  });

  it('can use the Clerk user id for personal accounts', async () => {
    const verifyToken: ClerkTokenVerifier = async () => ({ sub: 'user_123' });
    const authenticate = createClerkAuthenticator({
      secretKey: 'sk_test',
      sellerClaim: 'sub',
      verifyToken,
    });

    await expect(authenticate(request('Bearer session-token'))).resolves.toEqual({
      seller_id: 'user_123',
      user_id: 'user_123',
    });
  });

  it('rejects missing, malformed, and unverifiable tokens', async () => {
    const verifyToken: ClerkTokenVerifier = async () => {
      throw new Error('invalid token');
    };
    const authenticate = createClerkAuthenticator({
      secretKey: 'sk_test',
      verifyToken,
    });

    await expect(authenticate(request())).resolves.toBeNull();
    await expect(authenticate(request('Basic abc'))).resolves.toBeNull();
    await expect(authenticate(request('Bearer bad-token'))).resolves.toBeNull();
  });

  it('requires a secret key', () => {
    expect(() => createClerkAuthenticator({ secretKey: ' ' })).toThrow(
      'CLERK_SECRET_KEY is required',
    );
  });
});
