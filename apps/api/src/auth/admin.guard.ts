import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user as { userId: string } | undefined;
    if (!user?.userId) return false;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (dbUser?.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administradores');
    }
    return true;
  }
}
