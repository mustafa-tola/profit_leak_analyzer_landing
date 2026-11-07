import { describe, expect, it } from 'vitest';
import { resolveCorsHeaders } from '../cors';

describe('resolveCorsHeaders', () => {
  it('allows configured origins and exposes analysis quality', () => {
    const headers = resolveCorsHeaders('http://localhost:5173', {
      allowedOrigins: ['http://localhost:5173'],
    });

    expect(headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(headers['access-control-allow-headers']).toContain('authorization');
    expect(headers['access-control-expose-headers']).toContain('x-analysis-quality');
    expect(headers.vary).toBe('Origin');
  });

  it('does not return CORS headers for unconfigured origins', () => {
    expect(
      resolveCorsHeaders('https://evil.example', {
        allowedOrigins: ['http://localhost:5173'],
      }),
    ).toEqual({});
    expect(resolveCorsHeaders(null, { allowedOrigins: ['http://localhost:5173'] })).toEqual({});
  });
});
