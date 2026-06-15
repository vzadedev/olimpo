import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseInput } from './dto/create-exercise.input';

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

  create(input: CreateExerciseInput) {
    return this.prisma.exercise.create({ data: input });
  }

  findAll() {
    return this.prisma.exercise.findMany();
  }
}
