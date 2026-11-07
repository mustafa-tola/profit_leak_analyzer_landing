-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "analysis_runs" (
    "id" UUID NOT NULL,
    "seller_id" VARCHAR(191) NOT NULL,
    "persistence_version" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "as_of_date" DATE,
    "engine_version" VARCHAR(64) NOT NULL,
    "schema_version" VARCHAR(64) NOT NULL,
    "mapping_version" VARCHAR(64) NOT NULL,
    "input_fingerprint" CHAR(64) NOT NULL,
    "analysis_quality" VARCHAR(32) NOT NULL,
    "output_hash" CHAR(64) NOT NULL,
    "rules" JSONB NOT NULL,
    "coverage" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "counts" JSONB NOT NULL,
    "verification" JSONB NOT NULL,

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_files" (
    "id" TEXT NOT NULL,
    "run_id" UUID NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "filename" VARCHAR(512) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "row_count" INTEGER NOT NULL,
    "schema_version" VARCHAR(64) NOT NULL,
    "mapping_version" VARCHAR(64) NOT NULL,
    "headers" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,

    CONSTRAINT "source_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_rows" (
    "id" BIGSERIAL NOT NULL,
    "run_id" UUID NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "row_index" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "source_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_runs_seller_id_created_at_idx" ON "analysis_runs"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "analysis_runs_seller_id_input_fingerprint_idx" ON "analysis_runs"("seller_id", "input_fingerprint");

-- CreateIndex
CREATE INDEX "analysis_runs_seller_id_analysis_quality_idx" ON "analysis_runs"("seller_id", "analysis_quality");

-- CreateIndex
CREATE INDEX "source_files_sha256_idx" ON "source_files"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "source_files_run_id_source_key" ON "source_files"("run_id", "source");

-- CreateIndex
CREATE INDEX "source_rows_run_id_source_idx" ON "source_rows"("run_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "source_rows_run_id_source_row_index_key" ON "source_rows"("run_id", "source", "row_index");

-- AddForeignKey
ALTER TABLE "source_files" ADD CONSTRAINT "source_files_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_rows" ADD CONSTRAINT "source_rows_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
