-- CreateTable
CREATE TABLE "ReelLike" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlanMeal" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "meal_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "protein_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carb_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DietPlanMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReelLike_submission_id_user_id_key" ON "ReelLike"("submission_id", "user_id");

-- CreateIndex
CREATE INDEX "DietPlan_user_id_is_active_idx" ON "DietPlan"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "DietPlanMeal_plan_id_day_of_week_meal_type_idx" ON "DietPlanMeal"("plan_id", "day_of_week", "meal_type");

-- AddForeignKey
ALTER TABLE "ReelLike" ADD CONSTRAINT "ReelLike_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelLike" ADD CONSTRAINT "ReelLike_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlan" ADD CONSTRAINT "DietPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietPlanMeal" ADD CONSTRAINT "DietPlanMeal_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "DietPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
