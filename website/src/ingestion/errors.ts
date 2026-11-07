export type IngestionErrorCode =
  | 'UNSUPPORTED_FILE_TYPE'
  | 'EMPTY_FILE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_ENCODING'
  | 'CSV_UNCLOSED_QUOTE'
  | 'CSV_UNEXPECTED_QUOTE'
  | 'CSV_NO_HEADER'
  | 'EMPTY_HEADER'
  | 'DUPLICATE_HEADER'
  | 'CSV_ROW_LENGTH_MISMATCH'
  | 'MISSING_REQUIRED_COLUMN'
  | 'AMBIGUOUS_COLUMN_MAPPING';

export interface IngestionErrorDetail {
  code: IngestionErrorCode;
  message: string;
  source?: string;
  row_number?: number;
  column?: string;
}

export class IngestionError extends Error {
  readonly code: IngestionErrorCode;
  readonly details: IngestionErrorDetail[];

  constructor(code: IngestionErrorCode, message: string, details: IngestionErrorDetail[] = []) {
    super(message);
    this.name = 'IngestionError';
    this.code = code;
    this.details = details.length > 0 ? details : [{ code, message }];
  }
}
