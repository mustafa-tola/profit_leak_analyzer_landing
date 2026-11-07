import { describe, expect, it } from 'vitest';
import { IngestionError } from '../errors';
import { ingestCsvFile, ingestCsvText, parseCsv, sha256Hex } from '../csv';

const ORDERS_HEADER = 'seller_id,order_id,order_date,cod_amount_pkr,order_status';

function ordersCsv(rows: string, header = ORDERS_HEADER): string {
  return `${header}\n${rows}`;
}

function expectIngestionError(fn: () => unknown, code: string): IngestionError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(IngestionError);
    expect((error as IngestionError).code).toBe(code);
    return error as IngestionError;
  }
  throw new Error(`Expected IngestionError ${code}`);
}

describe('CSV ingestion', () => {
  it('maps canonical headers and aliases, preserving source evidence', () => {
    const file = ingestCsvText(
      'orders',
      'seller,order_no,order_date,cod,order_status,customer\n' +
        'SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed,CUST-1\n',
    );

    expect(file.row_count).toBe(1);
    expect(file.rows[0].order_id).toBe('ORD-1');
    expect(file.rows[0].cod_amount_pkr).toBe('1000.00');
    expect(file.rows[0].customer_ref).toBe('CUST-1');
    expect(file.rows[0]._row_number).toBe(1);
    expect(file.rows[0]._source_line).toBe(2);
    expect((file.rows[0]._raw as Record<string, string>).order_no).toBe('ORD-1');
    expect(file.headers.find((header) => header.source_header === 'order_no')?.canonical_field).toBe(
      'order_id',
    );
  });

  it('accepts BOM, CRLF and newlines inside quoted fields', () => {
    const csv =
      '\uFEFFseller_id,order_id,order_date,cod_amount_pkr,order_status,notes\r\n' +
      'SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed,"first line\r\nsecond line"\r\n';
    const table = parseCsv(csv);

    expect(table.headers).toHaveLength(6);
    expect(table.records).toHaveLength(1);
    expect(table.records[0].values[5]).toContain('second line');
    expect(table.records[0].line_number).toBe(2);
  });

  it('warns about unmapped columns but keeps them in evidence', () => {
    const file = ingestCsvText(
      'orders',
      ordersCsv('SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed,hello', `${ORDERS_HEADER},extra_note`),
    );

    expect(file.warnings).toHaveLength(1);
    expect(file.warnings[0].code).toBe('UNMAPPED_COLUMN');
    expect((file.rows[0]._raw as Record<string, string>).extra_note).toBe('hello');
  });

  it('rejects a missing required column', () => {
    const error = expectIngestionError(
      () =>
        ingestCsvText(
          'orders',
          'seller_id,order_id,order_date,order_status\nSELLER-DEMO,ORD-1,2026-10-01,confirmed',
        ),
      'MISSING_REQUIRED_COLUMN',
    );

    expect(error.details[0].column).toBe('cod_amount_pkr');
  });

  it('rejects duplicate header names after normalisation', () => {
    expectIngestionError(
      () =>
        ingestCsvText(
          'orders',
          ordersCsv('SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed,SELLER-DEMO', `${ORDERS_HEADER},Seller ID`),
        ),
      'DUPLICATE_HEADER',
    );
  });

  it('rejects two columns that map to the same canonical field', () => {
    expectIngestionError(
      () =>
        ingestCsvText(
          'orders',
          ordersCsv(
            'SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed,1000.00',
            `${ORDERS_HEADER},cod_amount`,
          ),
        ),
      'AMBIGUOUS_COLUMN_MAPPING',
    );
  });

  it('rejects an unclosed quoted field', () => {
    expectIngestionError(
      () =>
        ingestCsvText(
          'orders',
          ordersCsv('SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed,"unterminated'),
        ),
      'CSV_UNCLOSED_QUOTE',
    );
  });

  it('rejects a row whose column count does not match the header', () => {
    expectIngestionError(
      () => ingestCsvText('orders', ordersCsv('SELLER-DEMO,ORD-1,2026-10-01,1000.00')),
      'CSV_ROW_LENGTH_MISMATCH',
    );
  });

  it('rejects unsupported files, invalid UTF-8 and oversized input', async () => {
    const textFile = new File(['x'], 'orders.txt', { type: 'text/plain' });
    await expect(ingestCsvFile('orders', textFile)).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });

    const invalid = new File([new Uint8Array([0xff, 0xfe])], 'orders.csv', { type: 'text/csv' });
    await expect(ingestCsvFile('orders', invalid)).rejects.toMatchObject({
      code: 'INVALID_ENCODING',
    });

    const oversized = new File(
      [ordersCsv('SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed')],
      'orders.csv',
      { type: 'text/csv' },
    );
    await expect(ingestCsvFile('orders', oversized, { maxFileBytes: 5 })).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
  });

  it('hashes identical bytes identically', async () => {
    const bytes = new TextEncoder().encode(ordersCsv('SELLER-DEMO,ORD-1,2026-10-01,1000.00,confirmed'));
    const first = await sha256Hex(bytes);
    const second = await sha256Hex(bytes);

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});
