/**
 * Node HTTP adapter for the PLA API.
 *
 * Development:
 *   $env:PLA_DEV_HEADER_AUTH = "1"
 *   npm.cmd run api:dev
 *
 * PostgreSQL + Clerk:
 *   npm.cmd run db:deploy
 *   npm.cmd run api:dev
 *
 * Without DATABASE_URL the server falls back to the in-memory repository so the
 * Phase 2 smoke check remains runnable. Set PLA_REPOSITORY=prisma to require a
 * database explicitly.
 */

import { createServer, type IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
import {
  AnalysisService,
  InMemoryAnalysisRepository,
  PrismaAnalysisRepository,
  createAnalyzeHandler,
  createClerkAuthenticator,
  createDevHeaderAuthenticator,
  createGetAnalysisHandler,
  createHealthHandler,
  createListAnalysesHandler,
  type AnalysisRepository,
  type Authenticator,
  type ClerkSellerClaim,
} from '../src/api';
import { resolveCorsHeaders } from '../src/api/cors';
import { loadLocalEnv } from '../src/db/env';
import { disconnectPrisma, getPrismaClient } from '../src/db/prisma';

loadLocalEnv();

const host = process.env.HOST?.trim() || '127.0.0.1';
const port = Number(process.env.PORT ?? 8787);
const production = process.env.NODE_ENV === 'production';

// ── Rate limiting (in-memory, per seller + IP) ──────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per key
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt) rateLimitStore.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function rateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

function parseList(value: string | undefined): string[] | undefined {
  const items = value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items && items.length > 0 ? items : undefined;
}

function productionOrigins(name: string, origins: string[] | undefined): void {
  if (!production) return;
  if (!origins?.length || !origins.every((origin) => {
    const url = URL.canParse(origin) ? new URL(origin) : null;
    return url?.protocol === 'https:' && url.origin === origin;
  })) {
    throw new Error(`${name} must contain explicit HTTPS origins in production`);
  }
}

function sellerClaim(value: string | undefined): ClerkSellerClaim {
  if (value === undefined || value.trim() === '') return 'org_slug';
  if (value === 'org_slug' || value === 'org_id' || value === 'sub') return value;
  throw new Error('CLERK_SELLER_CLAIM must be org_slug, org_id, or sub');
}

function createRepository(): AnalysisRepository {
  const configured = process.env.PLA_REPOSITORY?.trim().toLowerCase();
  const mode = configured ?? (process.env.DATABASE_URL ? 'prisma' : 'memory');
  if (production && mode !== 'prisma') {
    throw new Error('Production requires PostgreSQL persistence');
  }

  if (mode === 'memory') {
    console.log('Persistence: in-memory (development only)');
    return new InMemoryAnalysisRepository();
  }

  if (mode === 'prisma') {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is required for PLA_REPOSITORY=prisma. Set it or use PLA_REPOSITORY=memory.',
      );
    }
    console.log('Persistence: PostgreSQL via Prisma');
    return new PrismaAnalysisRepository(getPrismaClient());
  }

  throw new Error('PLA_REPOSITORY must be "prisma" or "memory"');
}

function createAuthenticator(): Authenticator {
  if (process.env.PLA_DEV_HEADER_AUTH === '1') {
    if (production) throw new Error('Development header authentication is disabled in production');
    console.log('Authentication: development x-seller-id adapter');
    return createDevHeaderAuthenticator(true);
  }

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      'Set PLA_DEV_HEADER_AUTH=1 for local development or CLERK_SECRET_KEY for Clerk authentication.',
    );
  }

  const authorizedParties = parseList(process.env.CLERK_AUTHORIZED_PARTIES);
  productionOrigins('CLERK_AUTHORIZED_PARTIES', authorizedParties);
  const claim = sellerClaim(process.env.CLERK_SELLER_CLAIM);
  if (production && claim === 'org_slug') {
    throw new Error('Production requires CLERK_SELLER_CLAIM=org_id or sub');
  }
  console.log('Authentication: Clerk bearer tokens');
  return createClerkAuthenticator({
    secretKey,
    authorizedParties,
    sellerClaim: claim,
  });
}

const configuredOrigins = parseList(process.env.PLA_CORS_ORIGINS);
productionOrigins('PLA_CORS_ORIGINS', configuredOrigins);
const allowedOrigins = configuredOrigins ?? ['http://localhost:5173'];
const repository = createRepository();
const authenticator = createAuthenticator();
const service = new AnalysisService({ repository });
const analyzeHandler = createAnalyzeHandler({ authenticator, service });
const getAnalysisHandler = createGetAnalysisHandler({ authenticator, repository });
const listAnalysesHandler = createListAnalysesHandler({ authenticator, repository });
const healthHandler = createHealthHandler();

function toWebRequest(request: IncomingMessage, url: URL): Request {
  const headers = new Headers();
  Object.entries(request.headers).forEach(([key, value]) => {
    if (value === undefined) return;
    headers.set(key, Array.isArray(value) ? value.join(',') : value);
  });

  const method = request.method ?? 'GET';
  const init: RequestInit & { duplex?: 'half' } = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = Readable.toWeb(request) as unknown as BodyInit;
    init.duplex = 'half';
  }
  return new Request(url, init);
}

const server = createServer(async (request, response) => {
  const target = request.url ?? '/';
  const base = `http://localhost:${port}`;
  if (!URL.canParse(target, base)) {
    response.writeHead(400, { 'cache-control': 'no-store' }).end();
    return;
  }

  const url = new URL(target, base);
  const origin = Array.isArray(request.headers.origin)
    ? request.headers.origin[0]
    : request.headers.origin ?? null;
  const corsHeaders = resolveCorsHeaders(origin, { allowedOrigins });
  Object.entries(corsHeaders).forEach(([key, value]) => response.setHeader(key, value));

  // Forwarded headers are caller-controlled unless a trusted ingress rewrites them.
  const rate = url.pathname === '/health'
    ? null
    : rateLimit(request.socket.remoteAddress ?? 'unknown');
  if (rate) {
    response.setHeader('ratelimit-limit', String(RATE_LIMIT_MAX_REQUESTS));
    response.setHeader('ratelimit-remaining', String(rate.remaining));
    response.setHeader('ratelimit-reset', String(Math.ceil(rate.resetAt / 1000)));
    if (!rate.allowed) {
      response.statusCode = 429;
      response.setHeader('retry-after', String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))));
      response.setHeader('cache-control', 'no-store');
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(
        JSON.stringify({
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        }),
      );
      return;
    }
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    const webRequest = toWebRequest(request, url);
    let webResponse: Response;

    const runMatch = /^\/api\/analyses\/([^/]+)$/.exec(url.pathname);

    if (url.pathname === '/health') {
      webResponse = healthHandler(webRequest);
    } else if (url.pathname === '/api/analyses' && webRequest.method === 'GET') {
      webResponse = await listAnalysesHandler(webRequest);
    } else if (runMatch) {
      webResponse = await getAnalysisHandler(webRequest, runMatch[1]);
    } else if (url.pathname === '/api/analyses') {
      webResponse = await analyzeHandler(webRequest);
    } else {
      webResponse = new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Route not found' } }),
        {
          status: 404,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      );
    }

    response.statusCode = webResponse.status;
    if (webResponse.status >= 500) console.error('API handler returned a server error');
    webResponse.headers.forEach((value, key) => {
      response.setHeader(key, value);
    });
    const body = await webResponse.arrayBuffer();
    response.end(Buffer.from(body));
  } catch {
    console.error('API request processing failed');
    response.statusCode = 500;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'The API could not process the request',
        },
      }),
    );
  }
});

server.listen(port, host, () => {
  console.log(`PLA API listening on http://${host}:${port}`);
  console.log('Routes: GET /health, POST /api/analyses, GET /api/analyses, GET /api/analyses/:runId');
});

async function shutdown(): Promise<void> {
  server.close();
  await disconnectPrisma();
}

process.once('SIGINT', () => {
  void shutdown().then(() => process.exit(0));
});
process.once('SIGTERM', () => {
  void shutdown().then(() => process.exit(0));
});
