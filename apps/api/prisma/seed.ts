import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_EXERCISES = [
  { name: 'Supino Reto', muscleGroup: 'Peito' },
  { name: 'Supino Inclinado', muscleGroup: 'Peito' },
  { name: 'Agachamento', muscleGroup: 'Pernas' },
  { name: 'Levantamento Terra', muscleGroup: 'Costas' },
  { name: 'Rosca Direta', muscleGroup: 'Bíceps' },
  { name: 'Desenvolvimento', muscleGroup: 'Ombros' },
  { name: 'Leg Press', muscleGroup: 'Pernas' },
  { name: 'Remada Curvada', muscleGroup: 'Costas' },
  { name: 'Puxada Frontal', muscleGroup: 'Costas' },
  { name: 'Tríceps Pulley', muscleGroup: 'Tríceps' },
  { name: 'Panturrilha', muscleGroup: 'Pernas' },
  { name: 'Abdominal', muscleGroup: 'Abdômen' },
  { name: 'Mesa Flexora', muscleGroup: 'Pernas' },
  { name: 'Cadeira Extensora', muscleGroup: 'Pernas' },
  { name: 'Crucifixo', muscleGroup: 'Peito' },
];

async function main() {
  await prisma.checkinReaction.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.userPrivacySettings.deleteMany();
  await prisma.battleParticipant.deleteMany();
  await prisma.battle.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workoutSessionSet.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.workoutSchedule.deleteMany();
  await prisma.workoutPlanExercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.userGoal.deleteMany();
  await prisma.postReport.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postMention.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.mealFood.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.dietAnalysisLog.deleteMany();
  await prisma.userDietGoal.deleteMany();
  await prisma.reelComment.deleteMany();
  await prisma.reelReport.deleteMany();
  await prisma.reelView.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.exercise.deleteMany();

  const password = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const gym = await prisma.gym.create({
    data: {
      name: 'Iron Gym',
      photoUrl: null,
      latitude: -23.5505,
      longitude: -46.6333,
    },
  });

  const exercises = await Promise.all(
    DEFAULT_EXERCISES.map((ex) =>
      prisma.exercise.create({
        data: {
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          isDefault: true,
        },
      }),
    ),
  );

  const bench = exercises.find((e) => e.name === 'Supino Reto')!;
  const squat = exercises.find((e) => e.name === 'Agachamento')!;
  const deadlift = exercises.find((e) => e.name === 'Levantamento Terra')!;
  const legPress = exercises.find((e) => e.name === 'Leg Press')!;

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@gym.com',
        password: adminPassword,
        name: 'Admin',
        role: 'admin',
        city: 'São Paulo',
        instagramUsername: 'gymrank_admin',
        theme: 'dark',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alice@gym.com',
        password,
        name: 'Alice',
        city: 'São Paulo',
        instagramUsername: 'alice_lift',
        theme: 'dark',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@gym.com',
        password,
        name: 'Bob',
        city: 'São Paulo',
        instagramUsername: 'bob_strong',
        theme: 'dark',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol@gym.com',
        password,
        name: 'Carol',
        city: 'São Paulo',
        instagramUsername: 'carol_gains',
        theme: 'light',
      },
    }),
  ]);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { createdUserId: user.id, updatedUserId: user.id },
    });
  }

  const [admin, alice, bob, carol] = users;

  const submissions = [
    { userId: alice.id, exerciseId: bench.id, weight: 80, reps: 5 },
    { userId: bob.id, exerciseId: bench.id, weight: 120, reps: 3 },
    { userId: carol.id, exerciseId: bench.id, weight: 95, reps: 4 },
    { userId: alice.id, exerciseId: squat.id, weight: 100, reps: 5 },
    { userId: bob.id, exerciseId: squat.id, weight: 140, reps: 3 },
    { userId: carol.id, exerciseId: squat.id, weight: 110, reps: 4 },
    { userId: alice.id, exerciseId: deadlift.id, weight: 120, reps: 4 },
    { userId: bob.id, exerciseId: deadlift.id, weight: 180, reps: 2 },
    { userId: carol.id, exerciseId: deadlift.id, weight: 130, reps: 3 },
    { userId: carol.id, exerciseId: legPress.id, weight: 200, reps: 8 },
  ];

  const createdSubs = await Promise.all(
    submissions.map((s, i) =>
      prisma.submission.create({
        data: {
          ...s,
          gymId: gym.id,
          videoUrl: `/uploads/seed-video-${i + 1}.mp4`,
          createdUserId: s.userId,
          updatedUserId: s.userId,
        },
      }),
    ),
  );

  for (const sub of createdSubs) {
    await prisma.reelView.createMany({
      data: [
        { submissionId: sub.id, userId: alice.id },
        { submissionId: sub.id, userId: bob.id },
      ],
    });
  }

  await prisma.userGoal.create({
    data: {
      userId: alice.id,
      title: 'Levantar 100kg no supino',
      targetValue: 100,
      currentValue: 80,
      unit: 'kg',
      exerciseId: bench.id,
    },
  });

  const plan = await prisma.workoutPlan.create({
    data: {
      userId: alice.id,
      name: 'Treino A — Peito e Tríceps',
      description: 'Foco em força no peito',
    },
  });

  await prisma.workoutPlanExercise.createMany({
    data: [
      {
        planId: plan.id,
        exerciseId: bench.id,
        sets: 4,
        reps: 8,
        suggestedWeight: 70,
        orderIndex: 0,
      },
      {
        planId: plan.id,
        exerciseId: exercises.find((e) => e.name === 'Tríceps Pulley')!.id,
        sets: 3,
        reps: 12,
        orderIndex: 1,
      },
    ],
  });

  await prisma.userDietGoal.create({
    data: {
      userId: alice.id,
      caloriesGoal: 2200,
      proteinGoalG: 150,
      carbGoalG: 220,
      fatGoalG: 70,
      objective: 'maintain',
    },
  });

  const post1 = await prisma.post.create({
    data: {
      userId: bob.id,
      content: 'SUPINO COM O @alice_lift 💪 #supino',
      liftId: createdSubs[1].id,
      tags: { create: [{ tag: '#supino' }] },
      mentions: { create: [{ mentionedUserId: alice.id }] },
    },
  });

  await prisma.post.create({
    data: {
      userId: carol.id,
      content: 'Treino de pernas finalizado! #agachamento #treino',
      tags: { create: [{ tag: '#agachamento' }, { tag: '#treino' }] },
    },
  });

  await prisma.notification.create({
    data: {
      userId: alice.id,
      type: 'mention_post',
      referenceId: post1.id,
      referenceType: 'post',
    },
  });

  console.log('Seed complete');
  console.log('Admin: admin@gym.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
