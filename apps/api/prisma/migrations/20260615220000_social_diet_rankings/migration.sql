-- AlterTable
ALTER TABLE "User" ADD COLUMN "city" TEXT;

-- CreateTable
CREATE TABLE "UserDietGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "calories_goal" INTEGER NOT NULL,
    "protein_goal_g" DOUBLE PRECISION NOT NULL,
    "carb_goal_g" DOUBLE PRECISION NOT NULL,
    "fat_goal_g" DOUBLE PRECISION NOT NULL,
    "objective" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDietGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meal_type" TEXT NOT NULL,
    "eaten_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealFood" (
    "id" TEXT NOT NULL,
    "meal_id" TEXT NOT NULL,
    "food_name" TEXT NOT NULL,
    "quantity_description" TEXT,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein_g" DOUBLE PRECISION NOT NULL,
    "carb_g" DOUBLE PRECISION NOT NULL,
    "fat_g" DOUBLE PRECISION NOT NULL,
    "fiber_g" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MealFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietAnalysisLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietAnalysisLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "lift_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMention" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,

    CONSTRAINT "PostMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReport" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "reference_type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDietGoal_user_id_key" ON "UserDietGoal"("user_id");

-- CreateIndex
CREATE INDEX "Meal_user_id_eaten_at_idx" ON "Meal"("user_id", "eaten_at");

-- CreateIndex
CREATE INDEX "DietAnalysisLog_user_id_created_at_idx" ON "DietAnalysisLog"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PostMention_post_id_mentioned_user_id_key" ON "PostMention"("post_id", "mentioned_user_id");

-- CreateIndex
CREATE INDEX "PostTag_tag_idx" ON "PostTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_post_id_user_id_key" ON "PostLike"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "PostComment_post_id_created_at_idx" ON "PostComment"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PostReport_post_id_reporter_user_id_key" ON "PostReport"("post_id", "reporter_user_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_read_created_at_idx" ON "Notification"("user_id", "read", "created_at");

-- AddForeignKey
ALTER TABLE "UserDietGoal" ADD CONSTRAINT "UserDietGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealFood" ADD CONSTRAINT "MealFood_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietAnalysisLog" ADD CONSTRAINT "DietAnalysisLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMention" ADD CONSTRAINT "PostMention_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMention" ADD CONSTRAINT "PostMention_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Materialized view for city rankings
CREATE MATERIALIZED VIEW IF NOT EXISTS city_rankings AS
SELECT
  u.id AS user_id,
  u.name,
  u."avatarUrl" AS avatar_url,
  u.city,
  MAX(CASE WHEN LOWER(e.name) LIKE '%supino%' THEN s.weight END) AS best_bench,
  MAX(CASE WHEN LOWER(e.name) LIKE '%terra%' OR LOWER(e.name) LIKE '%deadlift%' THEN s.weight END) AS best_deadlift,
  MAX(CASE WHEN LOWER(e.name) LIKE '%agachamento%' OR LOWER(e.name) LIKE '%squat%' THEN s.weight END) AS best_squat,
  COUNT(DISTINCT ws.id) FILTER (WHERE ws.completed = true) AS total_workouts
FROM "User" u
LEFT JOIN "Submission" s ON s."userId" = u.id
LEFT JOIN "Exercise" e ON e.id = s."exerciseId"
LEFT JOIN "WorkoutSchedule" ws ON ws.user_id = u.id
GROUP BY u.id, u.name, u."avatarUrl", u.city;

CREATE INDEX IF NOT EXISTS idx_city_rankings_city ON city_rankings(city);
