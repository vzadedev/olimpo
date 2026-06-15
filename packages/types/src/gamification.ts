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

export interface ExerciseTitle {
  gymId: string;
  gymName: string;
  exerciseId: string;
  exerciseName: string;
  title: string;
}
