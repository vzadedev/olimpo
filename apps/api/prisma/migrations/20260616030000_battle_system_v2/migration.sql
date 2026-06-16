-- Battle system v2: recording window, attempts, stats

ALTER TABLE "Battle" ADD COLUMN IF NOT EXISTS "modality" TEXT NOT NULL DEFAULT 'max_weight';
ALTER TABLE "Battle" ADD COLUMN IF NOT EXISTS "challenger_best_volume" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Battle" ADD COLUMN IF NOT EXISTS "challenged_best_volume" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Battle" ADD COLUMN IF NOT EXISTS "window_start" TIMESTAMP(3);
ALTER TABLE "Battle" ADD COLUMN IF NOT EXISTS "window_end" TIMESTAMP(3);
ALTER TABLE "Battle" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);

UPDATE "Battle"
SET
  "window_end" = "deadline",
  "window_start" = "deadline" - INTERVAL '24 hours'
WHERE "window_end" IS NULL;

ALTER TABLE "Battle" ALTER COLUMN "window_start" SET NOT NULL;
ALTER TABLE "Battle" ALTER COLUMN "window_end" SET NOT NULL;

ALTER TABLE "Battle" DROP COLUMN IF EXISTS "deadline";

CREATE INDEX IF NOT EXISTS "Battle_status_window_end_idx" ON "Battle"("status", "window_end");

CREATE TABLE IF NOT EXISTS "BattleAttempt" (
    "id" TEXT NOT NULL,
    "battle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL DEFAULT 1,
    "volume" DOUBLE PRECISION NOT NULL,
    "submission_id" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattleAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BattleAttempt_battle_id_user_id_idx" ON "BattleAttempt"("battle_id", "user_id");

CREATE TABLE IF NOT EXISTS "UserBattleStats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_battles" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "win_streak" INTEGER NOT NULL DEFAULT 0,
    "best_win_streak" INTEGER NOT NULL DEFAULT 0,
    "favorite_exercise_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBattleStats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBattleStats_user_id_key" ON "UserBattleStats"("user_id");

ALTER TABLE "BattleAttempt" ADD CONSTRAINT "BattleAttempt_battle_id_fkey"
  FOREIGN KEY ("battle_id") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BattleAttempt" ADD CONSTRAINT "BattleAttempt_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BattleAttempt" ADD CONSTRAINT "BattleAttempt_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserBattleStats" ADD CONSTRAINT "UserBattleStats_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBattleStats" ADD CONSTRAINT "UserBattleStats_favorite_exercise_id_fkey"
  FOREIGN KEY ("favorite_exercise_id") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
