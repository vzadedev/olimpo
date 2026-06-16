-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_type" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "challenger_id" TEXT NOT NULL,
    "challenged_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'duel',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "challenger_best_kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "challenged_best_kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winner_id" TEXT,
    "provocation_message" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BattleParticipant" (
    "id" TEXT NOT NULL,
    "battle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "best_kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattleParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckinReaction" (
    "id" TEXT NOT NULL,
    "checkin_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckinReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPrivacySettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "public_checkin" BOOLEAN NOT NULL DEFAULT false,
    "public_profile" BOOLEAN NOT NULL DEFAULT true,
    "show_in_rankings" BOOLEAN NOT NULL DEFAULT true,
    "auto_battle_posts" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserBadge_user_id_badge_type_key" ON "UserBadge"("user_id", "badge_type");
CREATE INDEX "UserBadge_user_id_earned_at_idx" ON "UserBadge"("user_id", "earned_at");
CREATE INDEX "Battle_challenger_id_status_idx" ON "Battle"("challenger_id", "status");
CREATE INDEX "Battle_challenged_id_status_idx" ON "Battle"("challenged_id", "status");
CREATE UNIQUE INDEX "BattleParticipant_battle_id_user_id_key" ON "BattleParticipant"("battle_id", "user_id");
CREATE INDEX "Checkin_user_id_checked_in_at_idx" ON "Checkin"("user_id", "checked_in_at");
CREATE INDEX "Checkin_gym_id_expires_at_idx" ON "Checkin"("gym_id", "expires_at");
CREATE UNIQUE INDEX "CheckinReaction_checkin_id_user_id_key" ON "CheckinReaction"("checkin_id", "user_id");
CREATE UNIQUE INDEX "UserPrivacySettings_user_id_key" ON "UserPrivacySettings"("user_id");

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_challenged_id_fkey" FOREIGN KEY ("challenged_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BattleParticipant" ADD CONSTRAINT "BattleParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckinReaction" ADD CONSTRAINT "CheckinReaction_checkin_id_fkey" FOREIGN KEY ("checkin_id") REFERENCES "Checkin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckinReaction" ADD CONSTRAINT "CheckinReaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPrivacySettings" ADD CONSTRAINT "UserPrivacySettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
