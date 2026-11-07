import { z } from 'zod';
import type { SourceName } from '../engine/types';
import { RequestValidationError, type ValidationIssue } from './errors';

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date');

export const courierRuleSchema = z
  .object({
    courier: z.string().trim().min(1).max(60),
    settlement_days: z.union([
      z.string().trim().regex(/^\d+$/, 'Must be a whole number of days'),
      z.number().int().min(0).max(3650),
    ]),
  })
  .strict();

export const settlementCoverageSchema = z
  .object({
    courier: z.string().trim().min(1).max(60).optional(),
    covered_through: isoDateSchema,
    source: z.enum(['evidenced', 'user_declaration']).optional(),
    declared_by: z.string().trim().max(120).optional(),
    declared_at: z.string().trim().max(64).optional(),
  })
  .strict();

const formFieldsSchema = z.object({
  as_of_date: z.string().trim().optional(),
  courier_rules: z.string().trim().optional(),
  settlement_coverage: z.string().trim().optional(),
});

export interface AnalyzeOptions {
  asOfDate?: string;
  courierRules: Array<z.infer<typeof courierRuleSchema>>;
  coverage: Array<z.infer<typeof settlementCoverageSchema>>;
}

export const FILE_FIELDS: Record<SourceName, string> = {
  orders: 'orders_file',
  shipments: 'shipments_file',
  settlements: 'settlements_file',
  allocations: 'allocations_file',
};

export const REQUIRED_FILE_SOURCES: SourceName[] = ['orders', 'shipments', 'settlements'];

export const UPLOAD_SOURCES: SourceName[] = ['orders', 'shipments', 'settlements', 'allocations'];

function readString(formData: FormData, field: string): string | undefined {
  const value = formData.get(field);
  if (value === null) return undefined;
  if (typeof value !== 'string') {
    throw new RequestValidationError(`${field} must be a text field`, [
      { path: field, message: 'Expected a text field, received a file' },
    ]);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseJsonArray<T>(
  raw: string | undefined,
  schema: z.ZodType<T>,
  field: string,
): T[] {
  if (raw === undefined) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RequestValidationError(`${field} must be valid JSON`, [
      { path: field, message: 'Invalid JSON' },
    ]);
  }

  const result = z.array(schema).safeParse(parsed);
  if (!result.success) {
    throw new RequestValidationError(`${field} is invalid`, toIssues(result.error.issues, field));
  }
  return result.data;
}

function toIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
  prefix?: string,
): ValidationIssue[] {
  return issues.map((issue) => ({
    path: [prefix, ...issue.path.map(String)].filter(Boolean).join('.'),
    message: issue.message,
  }));
}

export function parseAnalyzeFields(formData: FormData): AnalyzeOptions {
  const raw = formFieldsSchema.safeParse({
    as_of_date: readString(formData, 'as_of_date'),
    courier_rules: readString(formData, 'courier_rules'),
    settlement_coverage: readString(formData, 'settlement_coverage'),
  });

  if (!raw.success) {
    throw new RequestValidationError('Upload options are invalid', toIssues(raw.error.issues));
  }

  let asOfDate: string | undefined;
  if (raw.data.as_of_date !== undefined) {
    const result = isoDateSchema.safeParse(raw.data.as_of_date);
    if (!result.success) {
      throw new RequestValidationError('as_of_date is invalid', toIssues(result.error.issues, 'as_of_date'));
    }
    asOfDate = result.data;
  }

  return {
    asOfDate,
    courierRules: parseJsonArray(raw.data.courier_rules, courierRuleSchema, 'courier_rules'),
    coverage: parseJsonArray(
      raw.data.settlement_coverage,
      settlementCoverageSchema,
      'settlement_coverage',
    ),
  };
}
