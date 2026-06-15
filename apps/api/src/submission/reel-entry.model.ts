import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReelEntry {
  @Field(() => ID)
  id: string;

  @Field()
  videoUrl: string;

  @Field(() => Float)
  weight: number;

  @Field()
  createdAt: Date;

  @Field()
  userEmail: string;

  @Field({ nullable: true })
  userName?: string;

  @Field({ nullable: true })
  instagramUsername?: string;

  @Field()
  exerciseName: string;

  @Field()
  gymName: string;
}
