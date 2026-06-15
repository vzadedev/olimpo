import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGymInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  photoUrl?: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;
}
