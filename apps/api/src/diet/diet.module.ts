import { Module } from '@nestjs/common';
import { DietService } from './diet.service';
import { DietResolver } from './diet.resolver';
import { DietController } from './diet.controller';

@Module({
  providers: [DietService, DietResolver],
  controllers: [DietController],
  exports: [DietService],
})
export class DietModule {}
