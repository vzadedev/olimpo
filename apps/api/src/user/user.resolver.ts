import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from './user.model';
import { UserProfileModel } from './user-profile.model';
import { UserService } from './user.service';
import { UpdateProfileInput } from './dto/update-profile.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string }) {
    return this.userService.findById(user.userId);
  }

  @Query(() => UserProfileModel)
  @UseGuards(JwtAuthGuard)
  userProfile(@Args('userId', { type: () => ID }) userId: string) {
    return this.userService.getPublicProfile(userId);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.userService.updateProfile(user.userId, input);
  }
}
