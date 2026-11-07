import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, readCsvFile } from '../../csv';

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'regression');

export function readFixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

export function readCsvFixture(name: string): Array<Record<string, string>> {
  return readCsvFile(join(FIXTURE_DIR, name));
}

export { parseCsv };
