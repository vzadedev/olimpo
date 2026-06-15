import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      name
      wallpaperUrl
      avatarUrl
      appIconUrl
      theme
      instagramUsername
      globalRank
      globalScore
      exerciseTitles {
        gymId
        gymName
        exerciseId
        exerciseName
        title
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      name
      wallpaperUrl
      avatarUrl
      appIconUrl
      theme
      instagramUsername
      globalRank
      globalScore
      exerciseTitles {
        gymId
        gymName
        exerciseId
        exerciseName
        title
      }
    }
  }
`;

export const GYMS = gql`
  query Gyms {
    gyms {
      id
      name
      photoUrl
      latitude
      longitude
    }
  }
`;

export const EXERCISES = gql`
  query Exercises {
    exercises {
      id
      name
    }
  }
`;

export const GYM_EXERCISES = gql`
  query GymExercises($gymId: ID!) {
    gymExercises(gymId: $gymId) {
      exerciseId
      exerciseName
      myScore
      myRank
      myBestWeight
      leaderTitle
    }
  }
`;

export const EXERCISE_WORKOUTS = gql`
  query ExerciseWorkouts($gymId: ID!, $exerciseId: ID!) {
    exerciseWorkouts(gymId: $gymId, exerciseId: $exerciseId) {
      id
      userName
      userEmail
      weight
      reps
      score
      rank
      title
      createdAt
    }
  }
`;

export const RANKING = gql`
  query Ranking($gymId: ID!, $exerciseId: ID!) {
    getRanking(gymId: $gymId, exerciseId: $exerciseId) {
      id
      weight
      reps
      score
      rank
      userEmail
      userName
      title
      videoUrl
    }
  }
`;

export const REELS = gql`
  query Reels {
    getReels {
      id
      videoUrl
      weight
      userEmail
      userName
      instagramUsername
      exerciseName
      gymName
      createdAt
    }
  }
`;

export const CREATE_SUBMISSION = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
      weight
      reps
    }
  }
`;
