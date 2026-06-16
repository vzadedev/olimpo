-- AlterTable
ALTER TABLE "User" ADD COLUMN "height_cm" DOUBLE PRECISION,
ADD COLUMN "weight_kg" DOUBLE PRECISION,
ADD COLUMN "birth_date" TIMESTAMP(3),
ADD COLUMN "sex" TEXT;

-- AlterTable
ALTER TABLE "UserDietGoal" ADD COLUMN "ai_explanation" TEXT;

-- CreateTable
CREATE TABLE "UserBodyMetricLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBodyMetricLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietRecommendationCache" (
    "id" TEXT NOT NULL,
    "weight_bucket" INTEGER NOT NULL,
    "height_bucket" INTEGER NOT NULL,
    "bmi_bucket" DOUBLE PRECISION NOT NULL,
    "sex" TEXT,
    "objective" TEXT NOT NULL,
    "calories_goal" INTEGER NOT NULL,
    "protein_goal_g" DOUBLE PRECISION NOT NULL,
    "carb_goal_g" DOUBLE PRECISION NOT NULL,
    "fat_goal_g" DOUBLE PRECISION NOT NULL,
    "ai_explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietRecommendationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBodyMetricLog_user_id_recorded_at_idx" ON "UserBodyMetricLog"("user_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "DietRecommendationCache_weight_bucket_height_bucket_bmi_buck_key" ON "DietRecommendationCache"("weight_bucket", "height_bucket", "bmi_bucket", "sex", "objective");

-- AddForeignKey
ALTER TABLE "UserBodyMetricLog" ADD CONSTRAINT "UserBodyMetricLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
