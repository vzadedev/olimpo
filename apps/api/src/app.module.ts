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

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    GymModule,
    ExerciseModule,
    SubmissionModule,
    UploadModule,
    TrainModule,
    GamificationModule,
  ],
})
export class AppModule {}
