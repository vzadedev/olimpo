import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './admin.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, AdminGuard, OptionalJwtAuthGuard],
  exports: [AuthService, JwtModule, AdminGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
