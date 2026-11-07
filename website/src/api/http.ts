import { IngestionError } from '../ingestion/errors';
import type { SourceName } from '../engine/types';
import type { Authenticator } from './auth';
import {
  FILE_FIELDS,
  REQUIRED_FILE_SOURCES,
  UPLOAD_SOURCES,
  parseAnalyzeFields,
} from './contracts';
import { ApiError, RequestValidationError } from './errors';
import type { AnalysisRepository, PersistedAnalysisRun } from './persistence';
import { normalizeSellerId } from './service';
import type { AnalysisService, UploadFiles } from './service';

export interface AnalyzeHandlerDeps {
  authenticator: Authenticator;
  service: AnalysisService;
  maxTotalBytes?: number;
}

export type AnalyzeHandler = (request: Request) => Promise<Response>;

const DEFAULT_MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function isFile(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as File).arrayBuffer === 'function' &&
    typeof (value as File).name === 'string' &&
    typeof (value as File).size === 'number'
  );
}

function errorBody(code: string, message: string, details?: unknown) {
  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}

function ingestionStatus(code: string): number {
  if (code === 'FILE_TOO_LARGE') return 413;
  if (code === 'UNSUPPORTED_FILE_TYPE') return 415;
  return 422;
}

/**
 * Public representation of an analysis run. Source rows are audit evidence and
 * are deliberately excluded from API responses.
 */
export function toPublicAnalysisRun(stored: PersistedAnalysisRun) {
  return {
    persistence_version: stored.persistence_version,
    run_id: stored.run_id,
    seller_id: stored.seller_id,
    created_at: stored.created_at,
    as_of_date: stored.as_of_date,
    engine_version: stored.engine_version,
    schema_version: stored.schema_version,
    mapping_version: stored.mapping_version,
    input_fingerprint: stored.input_fingerprint,
    analysis_quality: stored.result.analysis_quality,
    quality_message: stored.result.quality_message,
    output_hash: stored.result.output_hash,
    input_counts: stored.result.input_counts,
    valid_counts: stored.result.valid_counts,
    kpis_pkr: stored.result.kpis_pkr,
    counts: stored.counts,
    verification: stored.verification,
    source_files: stored.source_files,
    result: stored.result,
  };
}

export function createAnalyzeHandler(deps: AnalyzeHandlerDeps): AnalyzeHandler {
  const maxTotalBytes = deps.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;

  return async (request) => {
    if (request.method !== 'POST') {
      return json(405, errorBody('METHOD_NOT_ALLOWED', 'Use POST for this endpoint'), {
        allow: 'POST',
      });
    }

    let identity;
    try {
      identity = await deps.authenticator(request);
    } catch {
      return json(401, errorBody('UNAUTHORIZED', 'Authentication failed'));
    }
    if (!identity) {
      return json(401, errorBody('UNAUTHORIZED', 'Authentication is required'));
    }

    const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.startsWith('multipart/form-data')) {
      return json(
        415,
        errorBody('UNSUPPORTED_MEDIA_TYPE', 'Use multipart/form-data for CSV uploads'),
      );
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '');
    if (Number.isFinite(declaredLength) && declaredLength > maxTotalBytes) {
      return json(413, errorBody('UPLOAD_TOO_LARGE', 'The combined upload exceeds the size limit'));
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return json(400, errorBody('INVALID_FORM_DATA', 'The uploaded form could not be parsed'));
    }

    try {
      const options = parseAnalyzeFields(formData);
      const files: UploadFiles = {};

      for (const source of UPLOAD_SOURCES) {
        const value = formData.get(FILE_FIELDS[source]);
        if (value === null) continue;
        if (!isFile(value)) {
          throw new RequestValidationError(`${FILE_FIELDS[source]} must be a file`, [
            { path: FILE_FIELDS[source], message: 'Expected a CSV file' },
          ]);
        }
        files[source] = value;
      }

      const missing = REQUIRED_FILE_SOURCES.filter((source) => !files[source]);
      if (missing.length > 0) {
        throw new RequestValidationError(
          `Missing required file${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
          missing.map((source: SourceName) => ({
            path: FILE_FIELDS[source],
            message: `Upload the ${source} CSV`,
          })),
        );
      }

      const totalBytes = Object.values(files).reduce((total, file) => total + (file?.size ?? 0), 0);
      if (totalBytes > maxTotalBytes) {
        throw new ApiError(413, 'UPLOAD_TOO_LARGE', 'The combined upload exceeds the size limit');
      }

      const { stored } = await deps.service.analyzeUpload({
        sellerId: identity.seller_id,
        options,
        files,
      });

      return json(
        201,
        { data: toPublicAnalysisRun(stored) },
        {
          'x-analysis-quality': stored.result.analysis_quality,
        },
      );
    } catch (error) {
      if (error instanceof RequestValidationError) {
        return json(400, errorBody('VALIDATION_ERROR', error.message, error.issues));
      }
      if (error instanceof IngestionError) {
        return json(
          ingestionStatus(error.code),
          errorBody(error.code, error.message, error.details),
        );
      }
      if (error instanceof ApiError) {
        return json(error.status, errorBody(error.code, error.message, error.details));
      }
      return json(500, errorBody('INTERNAL_ERROR', 'The analysis could not be completed'));
    }
  };
}

export function createHealthHandler(): (request: Request) => Response {
  return (request) => {
    if (request.method !== 'GET') {
      return json(405, errorBody('METHOD_NOT_ALLOWED', 'Use GET for this endpoint'), {
        allow: 'GET',
      });
    }
    return json(200, { status: 'ok' });
  };
}

export interface ReadHandlerDeps {
  authenticator: Authenticator;
  repository: AnalysisRepository;
}

export type GetAnalysisHandler = (request: Request, runId: string) => Promise<Response>;
export type ListAnalysesHandler = (request: Request) => Promise<Response>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function readIdentity(
  deps: ReadHandlerDeps,
  request: Request,
): Promise<{ sellerId: string } | Response> {
  try {
    const identity = await deps.authenticator(request);
    if (!identity) {
      return json(401, errorBody('UNAUTHORIZED', 'Authentication is required'));
    }
    return { sellerId: normalizeSellerId(identity.seller_id) };
  } catch {
    return json(401, errorBody('UNAUTHORIZED', 'Authentication failed'));
  }
}

export function createGetAnalysisHandler(deps: ReadHandlerDeps): GetAnalysisHandler {
  return async (request, runId) => {
    if (request.method !== 'GET') {
      return json(405, errorBody('METHOD_NOT_ALLOWED', 'Use GET for this endpoint'), {
        allow: 'GET',
      });
    }

    const identity = await readIdentity(deps, request);
    if (identity instanceof Response) return identity;

    if (!UUID_PATTERN.test(runId)) {
      return json(404, errorBody('ANALYSIS_NOT_FOUND', 'Analysis run not found'));
    }

    try {
      const stored = await deps.repository.findById(identity.sellerId, runId);
      if (!stored) {
        return json(404, errorBody('ANALYSIS_NOT_FOUND', 'Analysis run not found'));
      }
      return json(
        200,
        { data: toPublicAnalysisRun(stored) },
        { 'x-analysis-quality': stored.result.analysis_quality },
      );
    } catch {
      return json(500, errorBody('INTERNAL_ERROR', 'The analysis could not be read'));
    }
  };
}

export function createListAnalysesHandler(deps: ReadHandlerDeps): ListAnalysesHandler {
  return async (request) => {
    if (request.method !== 'GET') {
      return json(405, errorBody('METHOD_NOT_ALLOWED', 'Use GET for this endpoint'), {
        allow: 'GET',
      });
    }

    const identity = await readIdentity(deps, request);
    if (identity instanceof Response) return identity;

    try {
      const runs = await deps.repository.listSummaries(identity.sellerId);
      return json(200, { data: runs });
    } catch {
      return json(500, errorBody('INTERNAL_ERROR', 'Analyses could not be listed'));
    }
  };
}
