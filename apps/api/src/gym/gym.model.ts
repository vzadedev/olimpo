import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Gym {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  photoUrl?: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}
