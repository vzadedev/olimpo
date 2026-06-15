import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Gym } from './gym.model';
import { GymService } from './gym.service';
import { CreateGymInput } from './dto/create-gym.input';

@Resolver(() => Gym)
export class GymResolver {
  constructor(private gymService: GymService) {}

  @Mutation(() => Gym)
  createGym(@Args('input') input: CreateGymInput) {
    return this.gymService.create(input);
  }

  @Query(() => [Gym])
  gyms() {
    return this.gymService.findAll();
  }
}
