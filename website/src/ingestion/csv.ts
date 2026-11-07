import type { EngineRow, SourceName } from '../engine/types';
import { IngestionError, type IngestionErrorDetail } from './errors';
import {
  DEFAULT_MAX_FILE_BYTES,
  MAPPING_VERSION,
  SCHEMA_VERSION,
  SOURCE_SPECS,
  aliasLookup,
  normalizeHeader,
} from './spec';

const ALLOWED_CSV_MIME_TYPES = new Set([
  '',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
  'application/octet-stream',
]);

export interface CsvRecord {
  values: string[];
  /** Data row number, excluding the header (1-based). */
  row_number: number;
  /** Physical line in the uploaded file where this record starts. */
  line_number: number;
}

export interface CsvTable {
  headers: string[];
  records: CsvRecord[];
}

export interface MappedHeader {
  source_header: string;
  canonical_field: string | null;
  column_index: number;
}

export interface IngestionWarning {
  code: 'UNMAPPED_COLUMN';
  message: string;
  source: SourceName;
  column: string;
}

export interface IngestedFile {
  source: SourceName;
  filename: string;
  size_bytes: number;
  sha256: string;
  row_count: number;
  schema_version: string;
  mapping_version: string;
  headers: MappedHeader[];
  warnings: IngestionWarning[];
  rows: EngineRow[];
}

export interface IngestOptions {
  maxFileBytes?: number;
}

function asError(code: IngestionErrorDetail['code'], message: string, details?: IngestionErrorDetail[]): IngestionError {
  return new IngestionError(code, message, details);
}

/**
 * Strict RFC 4180 parser. Supports BOM, CRLF, quoted commas, escaped quotes
 * and newlines inside quoted fields. Structural problems reject the file
 * rather than silently shifting columns.
 */
export function parseCsv(text: string): CsvTable {
  const source = text.replace(/^\uFEFF/, '');

  if (source.trim() === '') {
    throw asError('EMPTY_FILE', 'CSV file is empty');
  }

  const parsed: Array<{ values: string[]; line_number: number }> = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let justClosedQuote = false;
  let recordStarted = false;
  let line = 1;
  let recordStartLine = 1;

  const finishRecord = () => {
    row.push(field);
    const values = row;
    const allEmpty = values.every((value) => value.trim() === '');
    if (!allEmpty) {
      parsed.push({ values, line_number: recordStartLine });
    }
    row = [];
    field = '';
    recordStarted = false;
    justClosedQuote = false;
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        if (char === '\n') line += 1;
        field += char;
      }
      continue;
    }

    if (justClosedQuote) {
      if (char === ',' || char === '\n' || char === '\r') {
        justClosedQuote = false;
      } else if (char === ' ' || char === '\t') {
        // Tolerate padding after a closing quote.
        continue;
      } else {
        throw asError(
          'CSV_UNEXPECTED_QUOTE',
          `Unexpected character after a closing quote on line ${line}`,
        );
      }
    }

    if (char === '"') {
      if (field.length > 0) {
        throw asError(
          'CSV_UNEXPECTED_QUOTE',
          `Quote must start a field (line ${line})`,
        );
      }
      inQuotes = true;
      recordStarted = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      recordStarted = true;
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      finishRecord();
      line += 1;
      recordStartLine = line;
      continue;
    }

    field += char;
    recordStarted = true;
  }

  if (inQuotes) {
    throw asError('CSV_UNCLOSED_QUOTE', 'CSV ends with an unclosed quoted field');
  }

  if (recordStarted || field !== '' || row.length > 0) {
    finishRecord();
  }

  if (parsed.length === 0) {
    throw asError('CSV_NO_HEADER', 'CSV has no header row');
  }

  const [headerRecord, ...dataRecords] = parsed;
  const headers = headerRecord.values.map((header) => header.trim());

  if (headers.length === 0) {
    throw asError('CSV_NO_HEADER', 'CSV has no header columns');
  }

  headers.forEach((header, index) => {
    if (header === '') {
      throw asError('EMPTY_HEADER', `Header column ${index + 1} is empty`, [
        {
          code: 'EMPTY_HEADER',
          message: 'Header column is empty',
          column: String(index + 1),
        },
      ]);
    }
  });

  const seenHeaders = new Map<string, string>();
  headers.forEach((header) => {
    const normalized = normalizeHeader(header);
    if (seenHeaders.has(normalized)) {
      throw asError('DUPLICATE_HEADER', `Duplicate header: ${header}`, [
        {
          code: 'DUPLICATE_HEADER',
          message: `Header "${header}" duplicates "${seenHeaders.get(normalized)}"`,
          column: header,
        },
      ]);
    }
    seenHeaders.set(normalized, header);
  });

  const records = dataRecords.map((record, index) => {
    if (record.values.length !== headers.length) {
      throw asError(
        'CSV_ROW_LENGTH_MISMATCH',
        `Row ${index + 1} has ${record.values.length} columns; expected ${headers.length}`,
        [
          {
            code: 'CSV_ROW_LENGTH_MISMATCH',
            message: `Expected ${headers.length} columns, found ${record.values.length}`,
            row_number: index + 1,
          },
        ],
      );
    }
    return {
      values: record.values,
      row_number: index + 1,
      line_number: record.line_number,
    };
  });

  return { headers, records };
}

export interface HeaderMappingResult {
  headers: MappedHeader[];
  warnings: IngestionWarning[];
}

export function mapHeaders(source: SourceName, headers: string[]): HeaderMappingResult {
  const spec = SOURCE_SPECS[source];
  const lookup = aliasLookup(source);
  const mapped: MappedHeader[] = [];
  const warnings: IngestionWarning[] = [];
  const seenCanonical = new Map<string, string>();

  headers.forEach((header, columnIndex) => {
    const normalized = normalizeHeader(header);
    const canonical = lookup.get(normalized) ?? null;

    if (canonical) {
      const existing = seenCanonical.get(canonical);
      if (existing !== undefined) {
        throw asError(
          'AMBIGUOUS_COLUMN_MAPPING',
          `Both "${existing}" and "${header}" map to ${canonical}`,
          [
            {
              code: 'AMBIGUOUS_COLUMN_MAPPING',
              message: `Both "${existing}" and "${header}" map to ${canonical}`,
              column: canonical,
            },
          ],
        );
      }
      seenCanonical.set(canonical, header);
    } else {
      warnings.push({
        code: 'UNMAPPED_COLUMN',
        message: `Column "${header}" is preserved as evidence but is not used by the engine`,
        source,
        column: header,
      });
    }

    mapped.push({
      source_header: header,
      canonical_field: canonical,
      column_index: columnIndex,
    });
  });

  const missing = spec.mandatory.filter((field) => !seenCanonical.has(field));
  if (missing.length > 0) {
    throw asError(
      'MISSING_REQUIRED_COLUMN',
      `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      missing.map((field) => ({
        code: 'MISSING_REQUIRED_COLUMN',
        message: `Missing required column: ${field}`,
        column: field,
      })),
    );
  }

  return { headers: mapped, warnings };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  return bytesToHex(new Uint8Array(digest));
}

function decodeUtf8(bytes: Uint8Array, filename: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw asError('INVALID_ENCODING', `${filename} is not valid UTF-8`);
  }
}

function buildRows(
  source: SourceName,
  filename: string,
  table: CsvTable,
  mapping: HeaderMappingResult,
): EngineRow[] {
  return table.records.map((record) => {
    const raw: Record<string, string> = {};
    table.headers.forEach((header, index) => {
      raw[header] = record.values[index] ?? '';
    });

    const row: EngineRow = {
      _row_number: record.row_number,
      _source_line: record.line_number,
      _source_file: filename,
      _raw: raw,
    };

    SOURCE_SPECS[source].fields.forEach((field) => {
      row[field] = '';
    });

    mapping.headers.forEach((header) => {
      if (header.canonical_field !== null) {
        row[header.canonical_field] = record.values[header.column_index] ?? '';
      }
    });

    return row;
  });
}

export function ingestCsvText(
  source: SourceName,
  text: string,
  options: IngestOptions & { filename?: string; sha256?: string } = {},
): IngestedFile {
  const bytes = new TextEncoder().encode(text);
  const filename = options.filename ?? `${source}.csv`;
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;

  if (bytes.byteLength === 0) {
    throw asError('EMPTY_FILE', `${filename} is empty`);
  }
  if (bytes.byteLength > maxFileBytes) {
    throw asError('FILE_TOO_LARGE', `${filename} exceeds the ${maxFileBytes} byte limit`);
  }

  const table = parseCsv(decodeUtf8(bytes, filename));
  const mapping = mapHeaders(source, table.headers);

  return {
    source,
    filename,
    size_bytes: bytes.byteLength,
    sha256: options.sha256 ?? '',
    row_count: table.records.length,
    schema_version: SCHEMA_VERSION,
    mapping_version: MAPPING_VERSION,
    headers: mapping.headers,
    warnings: mapping.warnings,
    rows: buildRows(source, filename, table, mapping),
  };
}

export async function ingestCsvFile(
  source: SourceName,
  file: File,
  options: IngestOptions = {},
): Promise<IngestedFile> {
  const filename = file.name || `${source}.csv`;
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;

  if (!filename.toLowerCase().endsWith('.csv')) {
    throw asError('UNSUPPORTED_FILE_TYPE', `${filename} must have a .csv extension`);
  }

  const mime = (file.type ?? '').toLowerCase();
  if (!ALLOWED_CSV_MIME_TYPES.has(mime)) {
    throw asError('UNSUPPORTED_FILE_TYPE', `${filename} has unsupported MIME type ${mime}`);
  }

  if (file.size === 0) {
    throw asError('EMPTY_FILE', `${filename} is empty`);
  }
  if (file.size > maxFileBytes) {
    throw asError('FILE_TOO_LARGE', `${filename} exceeds the ${maxFileBytes} byte limit`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const parsed = ingestCsvText(source, decodeUtf8(bytes, filename), {
    ...options,
    filename,
    sha256,
  });

  return {
    ...parsed,
    size_bytes: bytes.byteLength,
  };
}
