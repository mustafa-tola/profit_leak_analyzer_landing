/**
 * Loads the nearest .env file when the runtime supports process.loadEnvFile().
 * Node 20.12+/24 provide it. A missing file is not an error; CI can inject
 * environment variables directly.
 */
export function loadLocalEnv(): void {
  const loader = (
    process as NodeJS.Process & { loadEnvFile?: (path?: string) => void }
  ).loadEnvFile;
  if (!loader) return;

  try {
    loader();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
