import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtHttpAuthGuard } from '../auth/jwt-http-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PostsService } from './posts.service';
import { CreatePostCommentInput, CreatePostInput, ReportPostInput } from './dto/posts.input';

@Controller('api/posts')
@UseGuards(JwtHttpAuthGuard)
export class PostsController {
  constructor(private posts: PostsService) {}

  @Get()
  getFeed(
    @CurrentUser() user: { userId: string },
    @Query('city') city?: string,
    @Query('page') page?: string,
  ) {
    return this.posts.getFeed(user.userId, city, Number(page) || 1);
  }

  @Post()
  createPost(
    @CurrentUser() user: { userId: string },
    @Body() body: CreatePostInput,
  ) {
    return this.posts.createPost(user.userId, body);
  }

  @Delete(':id')
  deletePost(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.posts.deletePost(user.userId, id);
  }

  @Post(':id/like')
  likePost(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.posts.toggleLike(user.userId, id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.posts.getComments(id);
  }

  @Post(':id/comments')
  createComment(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: CreatePostCommentInput,
  ) {
    return this.posts.createComment(user.userId, id, body);
  }

  @Post(':id/report')
  reportPost(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: ReportPostInput,
  ) {
    return this.posts.reportPost(user.userId, id, body);
  }
}

@Controller('api/users')
@UseGuards(JwtHttpAuthGuard)
export class UsersSearchController {
  constructor(private posts: PostsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.posts.searchUsers(q ?? '');
  }
}
