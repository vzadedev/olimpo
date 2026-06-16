import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  PostCommentModel,
  PostModel,
  PostsFeedModel,
  UserSearchResultModel,
} from './posts.models';
import {
  CreatePostCommentInput,
  CreatePostInput,
  ReportPostInput,
} from './dto/posts.input';
import { PostsService } from './posts.service';

@Resolver()
export class PostsResolver {
  constructor(private posts: PostsService) {}

  @Query(() => PostsFeedModel)
  @UseGuards(JwtAuthGuard)
  postsFeed(
    @CurrentUser() user: { userId: string },
    @Args('city', { nullable: true }) city?: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
  ) {
    return this.posts.getFeed(user.userId, city, page ?? 1);
  }

  @Query(() => [PostCommentModel])
  @UseGuards(JwtAuthGuard)
  postComments(@Args('postId', { type: () => ID }) postId: string) {
    return this.posts.getComments(postId);
  }

  @Query(() => [UserSearchResultModel])
  @UseGuards(JwtAuthGuard)
  searchUsers(
    @CurrentUser() user: { userId: string },
    @Args('q') q: string,
  ) {
    return this.posts.searchUsers(q, user.userId);
  }

  @Mutation(() => PostModel)
  @UseGuards(JwtAuthGuard)
  createPost(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreatePostInput,
  ) {
    return this.posts.createPost(user.userId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  deletePost(
    @CurrentUser() user: { userId: string },
    @Args('postId', { type: () => ID }) postId: string,
  ) {
    return this.posts.deletePost(user.userId, postId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  togglePostLike(
    @CurrentUser() user: { userId: string },
    @Args('postId', { type: () => ID }) postId: string,
  ) {
    return this.posts.toggleLike(user.userId, postId).then(() => true);
  }

  @Mutation(() => PostCommentModel)
  @UseGuards(JwtAuthGuard)
  createPostComment(
    @CurrentUser() user: { userId: string },
    @Args('postId', { type: () => ID }) postId: string,
    @Args('input') input: CreatePostCommentInput,
  ) {
    return this.posts.createComment(user.userId, postId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  reportPost(
    @CurrentUser() user: { userId: string },
    @Args('postId', { type: () => ID }) postId: string,
    @Args('input') input: ReportPostInput,
  ) {
    return this.posts.reportPost(user.userId, postId, input);
  }
}
