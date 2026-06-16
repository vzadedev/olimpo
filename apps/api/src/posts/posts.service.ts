import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePostCommentInput,
  CreatePostInput,
  ReportPostInput,
} from './dto/posts.input';

const TAG_PATTERNS = [
  { pattern: /supino/i, tag: '#supino' },
  { pattern: /agachamento|squat/i, tag: '#agachamento' },
  { pattern: /terra|deadlift/i, tag: '#terra' },
  { pattern: /treino|workout/i, tag: '#treino' },
];

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private extractTags(content: string) {
    const tags = new Set<string>();
    for (const { pattern, tag } of TAG_PATTERNS) {
      if (pattern.test(content)) tags.add(tag);
    }
    return Array.from(tags);
  }

  private async createNotifications(
    items: {
      userId: string;
      type: string;
      referenceId: string;
      referenceType: string;
    }[],
  ) {
    await this.notifications.createMany(items);
  }

  private mapAuthor(user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    instagramUsername: string | null;
  }) {
    return {
      id: user.id,
      name: user.name ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      instagramUsername: user.instagramUsername ?? undefined,
    };
  }

  private async mapPost(
    post: {
      id: string;
      content: string;
      createdAt: Date;
      userId: string;
      user: {
        id: string;
        name: string | null;
        avatarUrl: string | null;
        instagramUsername: string | null;
      };
      lift: {
        id: string;
        weight: number;
        reps: number;
        exercise: { name: string };
      } | null;
      tags: { tag: string }[];
      _count: { likes: number; comments: number };
      likes?: { userId: string }[];
    },
    viewerId: string,
  ) {
    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: this.mapAuthor(post.user),
      lift: post.lift
        ? {
            id: post.lift.id,
            weight: post.lift.weight,
            reps: post.lift.reps,
            exerciseName: post.lift.exercise.name,
          }
        : undefined,
      tags: post.tags.map((t) => t.tag),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      likedByMe: (post.likes ?? []).some((l) => l.userId === viewerId),
      isOwner: post.userId === viewerId,
    };
  }

  async getFeed(userId: string, city?: string, page = 1, pageSize = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { city: true },
    });
    const feedCity = city ?? user?.city;
    if (!feedCity) {
      throw new BadRequestException('Defina sua cidade no perfil para ver o feed');
    }

    const skip = (page - 1) * pageSize;
    const authorIds = await this.prisma.user.findMany({
      where: { city: feedCity },
      select: { id: true },
    });

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId: { in: authorIds.map((a) => a.id) } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              instagramUsername: true,
            },
          },
          lift: { include: { exercise: true } },
          tags: true,
          likes: { where: { userId }, select: { userId: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize + 1,
      }),
      this.prisma.post.count({
        where: { userId: { in: authorIds.map((a) => a.id) } },
      }),
    ]);

    const hasMore = posts.length > pageSize;
    const slice = posts.slice(0, pageSize);
    return {
      posts: await Promise.all(slice.map((p) => this.mapPost(p, userId))),
      hasMore,
      page,
      total,
    };
  }

  async createPost(userId: string, input: CreatePostInput) {
    if (input.content.length > 500) {
      throw new BadRequestException('Post deve ter no máximo 500 caracteres');
    }

    if (input.liftId) {
      const lift = await this.prisma.submission.findFirst({
        where: { id: input.liftId, userId },
      });
      if (!lift) throw new BadRequestException('Levantamento inválido');
    }

    const tags = this.extractTags(input.content);
    const mentionIds = input.mentionUserIds ?? [];

    const post = await this.prisma.post.create({
      data: {
        userId,
        content: input.content,
        liftId: input.liftId,
        tags: { create: tags.map((tag) => ({ tag })) },
        mentions: {
          create: mentionIds.map((mentionedUserId) => ({ mentionedUserId })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            instagramUsername: true,
          },
        },
        lift: { include: { exercise: true } },
        tags: true,
        likes: { where: { userId }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    await this.createNotifications(
      mentionIds
        .filter((id) => id !== userId)
        .map((mentionedUserId) => ({
          userId: mentionedUserId,
          type: 'mention_post',
          referenceId: post.id,
          referenceType: 'post',
        })),
    );

    return this.mapPost(post, userId);
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.userId !== userId) throw new ForbiddenException('Sem permissão');
    await this.prisma.post.delete({ where: { id: postId } });
    return true;
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await this.prisma.postLike.create({ data: { postId, userId } });
    if (post.userId !== userId) {
      await this.createNotifications([
        {
          userId: post.userId,
          type: 'like_post',
          referenceId: postId,
          referenceType: 'post',
        },
      ]);
    }
    return { liked: true };
  }

  async getComments(postId: string) {
    const comments = await this.prisma.postComment.findMany({
      where: { postId, parentId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            instagramUsername: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                instagramUsername: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: this.mapAuthor(c.user),
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        author: this.mapAuthor(r.user),
      })),
    }));
  }

  async createComment(
    userId: string,
    postId: string,
    input: CreatePostCommentInput,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    if (input.parentId) {
      const parent = await this.prisma.postComment.findFirst({
        where: { id: input.parentId, postId },
      });
      if (!parent) throw new BadRequestException('Comentário pai inválido');
      if (parent.parentId) {
        throw new BadRequestException('Respostas aninhadas limitadas a 1 nível');
      }
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content: input.content,
        parentId: input.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            instagramUsername: true,
          },
        },
      },
    });

    const notifications = [];
    if (post.userId !== userId) {
      notifications.push({
        userId: post.userId,
        type: 'comment_post',
        referenceId: postId,
        referenceType: 'post',
      });
    }
    for (const mentionedUserId of input.mentionUserIds ?? []) {
      if (mentionedUserId !== userId) {
        notifications.push({
          userId: mentionedUserId,
          type: 'mention_comment',
          referenceId: comment.id,
          referenceType: 'comment',
        });
      }
    }
    await this.createNotifications(notifications);

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: this.mapAuthor(comment.user),
    };
  }

  async reportPost(userId: string, postId: string, input: ReportPostInput) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    await this.prisma.postReport.upsert({
      where: { postId_reporterUserId: { postId, reporterUserId: userId } },
      create: {
        postId,
        reporterUserId: userId,
        reason: input.reason,
        description: input.description,
      },
      update: {
        reason: input.reason,
        description: input.description,
        status: 'pending',
      },
    });
    return true;
  }

  searchUsers(query: string, viewerId?: string, limit = 10) {
    if (!query.trim()) return [];
    const viewer = viewerId
      ? this.prisma.user.findUnique({
          where: { id: viewerId },
          select: { city: true },
        })
      : null;
    return Promise.resolve(viewer).then(async (v) => {
      const cityFilter = v?.city ? { city: v.city } : {};
      return this.prisma.user.findMany({
        where: {
          ...cityFilter,
          id: viewerId ? { not: viewerId } : undefined,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { instagramUsername: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          instagramUsername: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      });
    });
  }
}
