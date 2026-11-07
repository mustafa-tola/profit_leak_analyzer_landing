import { build } from 'esbuild';

await build({
  entryPoints: ['scripts/api-server.ts'],
  outfile: 'dist-api/server.mjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
