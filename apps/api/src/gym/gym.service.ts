import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymInput } from './dto/create-gym.input';

@Injectable()
export class GymService {
  constructor(private prisma: PrismaService) {}

  create(input: CreateGymInput) {
    return this.prisma.gym.create({ data: input });
  }

  findAll() {
    return this.prisma.gym.findMany();
  }
}
