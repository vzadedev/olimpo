export const GLOBAL_RANKS = [
  'Bronze',
  'Prata',
  'Ouro',
  'Platina',
  'Diamante',
  'Mestre',
  'Lendário',
] as const;

export type GlobalRank = (typeof GLOBAL_RANKS)[number];

export function computeGlobalRank(totalScore: number): GlobalRank {
  if (totalScore >= 1800) return 'Lendário';
  if (totalScore >= 1200) return 'Mestre';
  if (totalScore >= 800) return 'Diamante';
  if (totalScore >= 500) return 'Platina';
  if (totalScore >= 250) return 'Ouro';
  if (totalScore >= 100) return 'Prata';
  return 'Bronze';
}

export function buildExerciseTitle(exerciseName: string): string {
  const lower = exerciseName.toLowerCase();
  if (lower.includes('agachamento') || lower.includes('squat')) {
    return `Deus do ${exerciseName}`;
  }
  if (lower.includes('supino') || lower.includes('bench')) {
    return `Mestre do ${exerciseName}`;
  }
  if (lower.includes('leg press')) {
    return `Lenda do ${exerciseName}`;
  }
  return `Campeão do ${exerciseName}`;
}

export function computeScore(weight: number, reps: number): number {
  return Math.round(weight * reps);
}
