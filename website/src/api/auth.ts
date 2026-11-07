export interface AuthContext {
  seller_id: string;
  user_id?: string;
}

export type Authenticator = (request: Request) => Promise<AuthContext | null>;

/**
 * Development-only identity adapter. It is deliberately opt-in and must never
 * be used in production. Phase 3 replaces this with a real auth provider.
 */
export function createDevHeaderAuthenticator(enabled: boolean): Authenticator {
  return async (request) => {
    if (!enabled) return null;
    const seller = request.headers.get('x-seller-id')?.trim();
    if (!seller) return null;
    return { seller_id: seller };
  };
}
