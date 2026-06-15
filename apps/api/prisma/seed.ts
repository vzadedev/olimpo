import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.submission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.exercise.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  const gym = await prisma.gym.create({
    data: {
      name: 'Iron Gym',
      photoUrl: null,
      latitude: -23.5505,
      longitude: -46.6333,
    },
  });

  const exercises = await Promise.all([
    prisma.exercise.create({ data: { name: 'Bench Press' } }),
    prisma.exercise.create({ data: { name: 'Agachamento' } }),
    prisma.exercise.create({ data: { name: 'Leg Press' } }),
  ]);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@gym.com',
        password,
        name: 'Alice',
        instagramUsername: 'alice_lift',
        theme: 'dark',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@gym.com',
        password,
        name: 'Bob',
        instagramUsername: 'bob_strong',
        theme: 'dark',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol@gym.com',
        password,
        name: 'Carol',
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

  const submissions = [
    { userId: users[0].id, exerciseId: exercises[0].id, weight: 80, reps: 5 },
    { userId: users[1].id, exerciseId: exercises[0].id, weight: 120, reps: 3 },
    { userId: users[2].id, exerciseId: exercises[0].id, weight: 95, reps: 4 },
    { userId: users[0].id, exerciseId: exercises[1].id, weight: 100, reps: 5 },
    { userId: users[2].id, exerciseId: exercises[2].id, weight: 200, reps: 8 },
  ];

  await prisma.submission.createMany({
    data: submissions.map((s, i) => ({
      ...s,
      gymId: gym.id,
      videoUrl: `/uploads/seed-video-${i + 1}.mp4`,
      createdUserId: s.userId,
      updatedUserId: s.userId,
    })),
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
