import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Exercise {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  muscleGroup?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: false })
  isDefault: boolean;
}
