export interface CorsOptions {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
}

/**
 * Returns CORS headers only for explicitly allowed origins. Never use `*` with
 * Authorization-bearing requests.
 */
export function resolveCorsHeaders(
  origin: string | null,
  options: CorsOptions,
): Record<string, string> {
  if (!origin || !options.allowedOrigins.includes(origin)) return {};

  return {
    'access-control-allow-origin': origin,
    vary: 'Origin',
    'access-control-allow-methods': (options.allowedMethods ?? ['GET', 'POST', 'OPTIONS']).join(
      ', ',
    ),
    'access-control-allow-headers': (
      options.allowedHeaders ?? ['authorization', 'content-type']
    ).join(', '),
    'access-control-expose-headers': (
      options.exposedHeaders ?? ['x-analysis-quality']
    ).join(', '),
    'access-control-max-age': '600',
  };
}
