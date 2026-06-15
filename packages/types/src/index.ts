export * from './gamification';

export interface User {
  id: string;
  email: string;
  name?: string;
  wallpaperUrl?: string;
  avatarUrl?: string;
  appIconUrl?: string;
  theme?: string;
  instagramUsername?: string;
  globalRank?: string;
  globalScore?: number;
  exerciseTitles?: import('./gamification').ExerciseTitle[];
  createdAt: string;
  updatedAt?: string;
}

export interface Gym {
  id: string;
  name: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
}

export interface Exercise {
  id: string;
  name: string;
}

export interface GymExerciseScore {
  exerciseId: string;
  exerciseName: string;
  myScore: number;
  myRank: number;
  myBestWeight: number;
  leaderTitle?: string;
}

export interface WorkoutEntry {
  id: string;
  userName: string;
  userEmail: string;
  weight: number;
  reps: number;
  score: number;
  rank: number;
  title?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  weight: number;
  reps: number;
  videoUrl: string;
  createdAt: string;
  userId: string;
  gymId: string;
  exerciseId: string;
}

export interface RankingEntry {
  id: string;
  weight: number;
  reps: number;
  score: number;
  videoUrl: string;
  createdAt: string;
  userEmail: string;
  userName?: string;
  rank: number;
  title?: string;
}

export interface ReelEntry {
  id: string;
  videoUrl: string;
  weight: number;
  createdAt: string;
  userEmail: string;
  userName?: string;
  instagramUsername?: string;
  exerciseName: string;
  gymName: string;
}

export interface AuthPayload {
  accessToken: string;
}

export interface UpdateProfileInput {
  name?: string;
  wallpaperUrl?: string;
  avatarUrl?: string;
  appIconUrl?: string;
  theme?: string;
  instagramUsername?: string;
}
