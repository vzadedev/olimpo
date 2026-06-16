import { BadRequestException, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

export type VideoValidationResult = {
  peso_visivel?: boolean;
  peso_estimado_kg?: number;
  peso_condizente?: boolean;
  movimento_completo?: boolean;
  exercicio_identificado?: string;
  exercicio_condizente?: boolean;
  confianca?: string;
  flags?: string[];
  observacao?: string;
  erro?: string;
};

@Injectable()
export class VideoValidationService {
  private anthropic: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  resolveStatus(result: VideoValidationResult): string {
    if (result.erro) return 'unverified';
    const flags = result.flags ?? [];
    if (flags.includes('peso_divergente') || flags.includes('exercicio_diferente')) {
      return 'flagged';
    }
    if (result.confianca === 'baixa' || flags.includes('peso_nao_visivel')) {
      return 'unverified';
    }
    if (result.peso_condizente && result.movimento_completo) {
      return 'approved';
    }
    return 'unverified';
  }

  async validateSubmissionVideo(
    submissionId: string,
    declaredWeightKg: number,
    exerciseName: string,
    frames: string[],
  ) {
    if (!this.anthropic) {
      throw new BadRequestException('ANTHROPIC_API_KEY não configurada no servidor');
    }
    if (!frames?.length || frames.length < 1) {
      throw new BadRequestException('Envie ao menos 1 frame do vídeo');
    }

    const frameContents = frames.slice(0, 3).flatMap((data, i) => [
      {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data,
        },
      },
      {
        type: 'text' as const,
        text: `Frame ${i + 1} do levantamento no OLIMPO`,
      },
    ]);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            ...frameContents,
            {
              type: 'text',
              text: `O atleta declarou ${exerciseName} com ${declaredWeightKg}kg no OLIMPO.
Analise os frames e retorne APENAS JSON válido:
{
  "peso_visivel": true,
  "peso_estimado_kg": 100,
  "peso_condizente": true,
  "movimento_completo": true,
  "exercicio_identificado": "Supino Reto",
  "exercicio_condizente": true,
  "confianca": "alta | media | baixa",
  "flags": [],
  "observacao": ""
}
Flags: peso_nao_visivel, peso_divergente, movimento_incompleto, exercicio_diferente, video_suspeito, sem_barra`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new BadRequestException('Resposta inválida da IA');
    }

    const clean = textBlock.text.trim().replace(/^```json|```$/gm, '').trim();
    let result: VideoValidationResult;
    try {
      result = JSON.parse(clean);
    } catch {
      throw new BadRequestException('Não foi possível interpretar validação do vídeo');
    }

    const validationStatus = this.resolveStatus(result);

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        videoValidationStatus: validationStatus,
        videoValidationResult: result as object,
        videoValidatedAt: new Date(),
      },
    });

    if (validationStatus === 'flagged') {
      const contestCount = await this.prisma.liftContest.count({
        where: { submissionId, status: 'pending' },
      });
      if (contestCount >= 3) {
        await this.prisma.submission.update({
          where: { id: submissionId },
          data: { videoValidationStatus: 'flagged' },
        });
      }
    }

    return { validationStatus, result };
  }
}
