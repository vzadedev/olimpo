import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateExerciseInput {
  @Field()
  name: string;
}
