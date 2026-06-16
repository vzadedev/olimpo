import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PostsController, UsersSearchController } from './posts.controller';

@Module({
  providers: [PostsService, PostsResolver],
  controllers: [PostsController, UsersSearchController],
  exports: [PostsService],
})
export class PostsModule {}
