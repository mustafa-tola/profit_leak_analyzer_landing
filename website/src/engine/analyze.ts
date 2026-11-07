import { normalizeInput } from './normalize';
import { reconcile, type ReconciliationOutput } from './reconcile';
import type { AnalysisQuality, EngineInput, NormalizedInput } from './types';

export interface AnalysisResult extends ReconciliationOutput {
  analysis_quality: AnalysisQuality;
  quality_message: string;
  rejected_row_count: number;
  validation_error_count: number;
}

const QUALITY_MESSAGES: Record<AnalysisQuality, string> = {
  CLEAN: 'All submitted records passed validation.',
  PARTIAL_DATA:
    'Some input records were rejected. Financial totals exclude rejected records.',
  NO_VALID_SETTLEMENTS:
    'No submitted settlement records were accepted. Payment and outstanding figures may be materially incomplete.',
};

export function classifyAnalysis(normalized: NormalizedInput): AnalysisQuality {
  const submittedSettlements = normalized.input_counts.settlements;
  const acceptedSettlements = normalized.valid_counts.settlements;
  const rejectedRows = normalized.invalid_rows.length;
  const validationErrorCount = normalized.validation_errors.filter(
    (error) => error.level === 'error',
  ).length;

  if (submittedSettlements > 0 && acceptedSettlements === 0) {
    return 'NO_VALID_SETTLEMENTS';
  }
  if (rejectedRows > 0 || validationErrorCount > 0) {
    return 'PARTIAL_DATA';
  }
  return 'CLEAN';
}

export function analyze(input: EngineInput): AnalysisResult {
  const normalized = normalizeInput(input);
  const reconciliation = reconcile(normalized);
  const analysisQuality = classifyAnalysis(normalized);
  const rejectedRowCount = normalized.invalid_rows.length;
  const validationErrorCount = normalized.validation_errors.filter(
    (error) => error.level === 'error',
  ).length;

  return {
    ...reconciliation,
    analysis_quality: analysisQuality,
    quality_message: QUALITY_MESSAGES[analysisQuality],
    rejected_row_count: rejectedRowCount,
    validation_error_count: validationErrorCount,
  };
}

/**
 * Converts bigint values to exact decimal strings for JSON/API/PostgreSQL
 * storage. Never converts money to a JavaScript number.
 */
export function toSerializable<T>(value: T): T {
  if (typeof value === 'bigint') return value.toString() as T;
  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(value as Record<string, unknown>).forEach((key) => {
      out[key] = toSerializable((value as Record<string, unknown>)[key]);
    });
    return out as T;
  }
  return value;
}
