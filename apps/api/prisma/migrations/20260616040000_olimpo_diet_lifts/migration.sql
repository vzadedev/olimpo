-- OLIMPO: campos de dieta, validação de vídeo e contestação

ALTER TABLE "Meal" ADD COLUMN IF NOT EXISTS "ai_confidence" TEXT;

ALTER TABLE "MealFood" ADD COLUMN IF NOT EXISTS "preparation_method" TEXT;
ALTER TABLE "MealFood" ADD COLUMN IF NOT EXISTS "quantity_g" DOUBLE PRECISION;
ALTER TABLE "MealFood" ADD COLUMN IF NOT EXISTS "was_edited_by_user" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "video_validation_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "video_validation_result" JSONB;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "video_validated_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "LiftContest" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "contestant_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiftContest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LiftContest_submission_id_contestant_user_id_key"
  ON "LiftContest"("submission_id", "contestant_user_id");
CREATE INDEX IF NOT EXISTS "LiftContest_submission_id_status_idx"
  ON "LiftContest"("submission_id", "status");

ALTER TABLE "LiftContest" ADD CONSTRAINT "LiftContest_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiftContest" ADD CONSTRAINT "LiftContest_contestant_user_id_fkey"
  FOREIGN KEY ("contestant_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CommonFood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity_g_base" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein_g" DOUBLE PRECISION NOT NULL,
    "carb_g" DOUBLE PRECISION NOT NULL,
    "fat_g" DOUBLE PRECISION NOT NULL,
    "fiber_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT 'outros',
    CONSTRAINT "CommonFood_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommonFood_name_idx" ON "CommonFood"("name");
