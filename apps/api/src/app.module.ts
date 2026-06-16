import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Request } from 'express';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GymModule } from './gym/gym.module';
import { ExerciseModule } from './exercise/exercise.module';
import { SubmissionModule } from './submission/submission.module';
import { UploadModule } from './upload/upload.module';
import { TrainModule } from './train/train.module';
import { GamificationModule } from './gamification/gamification.module';
import { GoalsModule } from './goals/goals.module';
import { WorkoutModule } from './workout/workout.module';
import { RankingsModule } from './rankings/rankings.module';
import { DietModule } from './diet/diet.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BattlesModule } from './battles/battles.module';
import { CheckinModule } from './checkin/checkin.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    NotificationsModule,
    PrismaModule,
    AuthModule,
    UserModule,
    GymModule,
    ExerciseModule,
    SubmissionModule,
    UploadModule,
    TrainModule,
    GamificationModule,
    GoalsModule,
    WorkoutModule,
    RankingsModule,
    DietModule,
    PostsModule,
    BattlesModule,
    CheckinModule,
  ],
})
export class AppModule {}
