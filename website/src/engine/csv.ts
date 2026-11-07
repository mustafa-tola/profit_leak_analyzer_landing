import { readFileSync } from 'node:fs';

/** Small RFC-4180 parser used by smoke checks and, later, the ingestion layer. */
export function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  const header = rows.shift() ?? [];
  return rows
    .filter((values) => values.some((value) => value !== ''))
    .map((values, index) => {
      const record: Record<string, string> = { _row_number: String(index + 1) };
      header.forEach((name, column) => {
        record[name] = values[column] ?? '';
      });
      return record;
    });
}

export function readCsvFile(path: string): Array<Record<string, string>> {
  return parseCsv(readFileSync(path, 'utf8'));
}
