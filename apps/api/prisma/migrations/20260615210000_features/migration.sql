-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "muscle_group" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "ReelView" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelReport" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelComment" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "exercise_id" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlanExercise" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" INTEGER NOT NULL DEFAULT 10,
    "suggested_weight" DOUBLE PRECISION,
    "rest_seconds" INTEGER NOT NULL DEFAULT 60,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkoutPlanExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSchedule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "WorkoutSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSessionSet" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "plan_exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "WorkoutSessionSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReelView_submission_id_user_id_viewed_at_idx" ON "ReelView"("submission_id", "user_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "ReelReport_submission_id_reporter_user_id_key" ON "ReelReport"("submission_id", "reporter_user_id");

-- CreateIndex
CREATE INDEX "ReelComment_submission_id_created_at_idx" ON "ReelComment"("submission_id", "created_at");

-- CreateIndex
CREATE INDEX "UserGoal_user_id_status_idx" ON "UserGoal"("user_id", "status");

-- CreateIndex
CREATE INDEX "WorkoutSchedule_user_id_scheduled_date_idx" ON "WorkoutSchedule"("user_id", "scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSessionSet_session_id_plan_exercise_id_set_number_key" ON "WorkoutSessionSet"("session_id", "plan_exercise_id", "set_number");

-- AddForeignKey
ALTER TABLE "ReelView" ADD CONSTRAINT "ReelView_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelView" ADD CONSTRAINT "ReelView_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelReport" ADD CONSTRAINT "ReelReport_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelReport" ADD CONSTRAINT "ReelReport_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelComment" ADD CONSTRAINT "ReelComment_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelComment" ADD CONSTRAINT "ReelComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelComment" ADD CONSTRAINT "ReelComment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ReelComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlanExercise" ADD CONSTRAINT "WorkoutPlanExercise_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlanExercise" ADD CONSTRAINT "WorkoutPlanExercise_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSchedule" ADD CONSTRAINT "WorkoutSchedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSchedule" ADD CONSTRAINT "WorkoutSchedule_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "WorkoutSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionSet" ADD CONSTRAINT "WorkoutSessionSet_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionSet" ADD CONSTRAINT "WorkoutSessionSet_plan_exercise_id_fkey" FOREIGN KEY ("plan_exercise_id") REFERENCES "WorkoutPlanExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
