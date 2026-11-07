export type SourceName = 'orders' | 'shipments' | 'settlements' | 'allocations';
export type EntryType = 'PAYMENT' | 'REVERSAL' | 'ADJUSTMENT';
export type NormalizedStatus =
  | 'delivered'
  | 'returned'
  | 'in_transit'
  | 'cancelled'
  | 'lost'
  | 'unknown';

export interface EngineRow {
  [field: string]: unknown;
}

export interface EngineInput {
  seller_id: string;
  run_id?: string;
  as_of_date?: string;
  courier_rules?: Array<{ courier?: string; settlement_days?: string | number }>;
  settlement_coverage?: Array<{
    courier?: string;
    covered_through?: string;
    source?: string;
    declared_by?: string;
    declared_at?: string;
  }>;
  orders?: EngineRow[];
  shipments?: EngineRow[];
  settlements?: EngineRow[];
  allocations?: EngineRow[];
}

export interface ValidationError {
  source: SourceName;
  row_number: number;
  field: string;
  code: string;
  level: 'error' | 'warning';
  message: string;
  raw_value: string;
}

export interface ValidatedRecord {
  source: SourceName;
  row_number: number;
  raw: Record<string, unknown>;
  vals: Record<string, string>;
  refs: Record<string, string>;
  money: Record<string, bigint | null>;
  dates: Record<string, string | null>;
  entry_type: EntryType | null;
  cross_seller: boolean;
  field_valid: boolean;
  is_valid: boolean;
  normalized_status?: NormalizedStatus;
}

export interface InvalidRow {
  source: SourceName;
  row_number: number;
  raw: Record<string, unknown>;
  cross_seller: boolean;
}

export interface CourierRule {
  courier: string;
  settlement_days: number;
}

export interface SettlementCoverage {
  courier: string;
  covered_through: string;
  source: 'evidenced' | 'user_declaration';
  declared_by: string;
  declared_at: string;
}

export interface NormalizedInput {
  engine_version: string;
  seller_id: string;
  run_id: string;
  as_of_date: string | null;
  rules: CourierRule[];
  coverage: SettlementCoverage[];
  warnings: Array<Record<string, unknown>>;
  input_counts: Record<SourceName, number>;
  valid_counts: Record<SourceName, number>;
  validation_errors: ValidationError[];
  invalid_rows: InvalidRow[];
  valid: Record<SourceName, ValidatedRecord[]>;
  settlement_entry_types: Record<string, string>;
  invalid_settlement_keys: string[];
  ambiguous_tracking: Record<string, string[]>;
}

export type AnalysisQuality = 'CLEAN' | 'PARTIAL_DATA' | 'NO_VALID_SETTLEMENTS';
