import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

}
bootstrap();
