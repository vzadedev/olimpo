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

export const USER_PROFILE = gql`
  query UserProfile($userId: ID!) {
    userProfile(userId: $userId) {
      id
      name
      avatarUrl
      instagramUsername
      city
      globalRank
      globalScore
      bmi
      submissionsCount
      exerciseTitles {
        gymId
        gymName
        exerciseId
        exerciseName
        title
      }
      badges {
        id
        title
        description
        earnedAt
      }
    }
  }
`;

export const MY_DIET_PLANS = gql`
  query MyDietPlans {
    myDietPlans {
      id
      name
      description
      isActive
      meals {
        id
        dayOfWeek
        mealType
        name
        notes
        calories
        proteinG
        carbG
        fatG
      }
    }
  }
`;

export const ACTIVE_DIET_PLAN = gql`
  query ActiveDietPlan {
    activeDietPlan {
      id
      name
      description
      isActive
      meals {
        id
        dayOfWeek
        mealType
        name
        notes
        calories
        proteinG
        carbG
        fatG
      }
    }
  }
`;

export const CREATE_DIET_PLAN = gql`
  mutation CreateDietPlan($input: CreateDietPlanInput!) {
    createDietPlan(input: $input) {
      id
      name
      isActive
    }
  }
`;

export const ACTIVATE_DIET_PLAN = gql`
  mutation ActivateDietPlan($planId: ID!) {
    activateDietPlan(planId: $planId) {
      id
      name
      isActive
    }
  }
`;

export const DELETE_DIET_PLAN = gql`
  mutation DeleteDietPlan($planId: ID!) {
    deleteDietPlan(planId: $planId)
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      name
      role
      wallpaperUrl
      avatarUrl
      appIconUrl
      theme
      instagramUsername
      city
      heightCm
      weightKg
      bmi
      sex
      birthDate
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
      city
      heightCm
      weightKg
      bmi
      sex
      birthDate
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
  query Reels($mineOnly: Boolean) {
    getReels(mineOnly: $mineOnly) {
      id
      videoUrl
      weight
      userId
      userEmail
      userName
      instagramUsername
      exerciseName
      gymName
      createdAt
      viewCount
      commentCount
      likeCount
      likedByMe
      isOwner
    }
  }
`;

export const TOGGLE_REEL_LIKE = gql`
  mutation ToggleReelLike($submissionId: ID!) {
    toggleReelLike(submissionId: $submissionId) {
      liked
      likeCount
    }
  }
`;

export const RECORD_REEL_VIEW = gql`
  mutation RecordReelView($submissionId: ID!) {
    recordReelView(submissionId: $submissionId) {
      counted
      viewCount
    }
  }
`;

export const DELETE_REEL = gql`
  mutation DeleteReel($submissionId: ID!) {
    deleteReel(submissionId: $submissionId) {
      success
    }
  }
`;

export const REPORT_REEL = gql`
  mutation ReportReel($input: ReportReelInput!) {
    reportReel(input: $input)
  }
`;

export const REEL_COMMENTS = gql`
  query ReelComments($submissionId: ID!, $offset: Int, $limit: Int) {
    reelComments(submissionId: $submissionId, offset: $offset, limit: $limit) {
      total
      hasMore
      items {
        id
        text
        userName
        userId
        parentId
        createdAt
        replies {
          id
          text
          userName
          userId
          parentId
          createdAt
        }
      }
    }
  }
`;

export const CREATE_REEL_COMMENT = gql`
  mutation CreateReelComment($input: CreateReelCommentInput!) {
    createReelComment(input: $input) {
      id
      text
      userName
      userId
      parentId
      createdAt
    }
  }
`;

export const DELETE_REEL_COMMENT = gql`
  mutation DeleteReelComment($commentId: ID!) {
    deleteReelComment(commentId: $commentId)
  }
`;

export const PENDING_REEL_REPORTS = gql`
  query PendingReelReports {
    pendingReelReports {
      id
      submissionId
      reason
      description
      status
      reporterName
      reelExerciseName
      createdAt
    }
  }
`;

export const UPDATE_REEL_REPORT_STATUS = gql`
  mutation UpdateReelReportStatus($reportId: ID!, $status: String!) {
    updateReelReportStatus(reportId: $reportId, status: $status)
  }
`;

export const MY_GOALS = gql`
  query MyGoals($status: String) {
    myGoals(status: $status) {
      id
      title
      description
      targetValue
      currentValue
      unit
      exerciseId
      exerciseName
      deadline
      status
      completedAt
      progressPercent
      createdAt
    }
  }
`;

export const MY_METRICS = gql`
  query MyMetrics {
    myMetrics {
      submissionsThisMonth
      currentStreak
      longestStreak
      maxWeightByExercise {
        exerciseName
        maxWeight
      }
      weeklyProgress {
        weekLabel
        submissions
        totalVolume
      }
      badges {
        id
        title
        description
        earnedAt
      }
      completedGoals {
        id
        title
        completedAt
        progressPercent
      }
      currentWeightKg
      currentHeightCm
      currentBmi
      bodyMetricHistory {
        recordedAt
        weightKg
        heightCm
        bmi
      }
    }
  }
`;

export const CREATE_GOAL = gql`
  mutation CreateGoal($input: CreateGoalInput!) {
    createGoal(input: $input) {
      id
      title
      targetValue
      currentValue
      unit
      status
      progressPercent
    }
  }
`;

export const UPDATE_GOAL = gql`
  mutation UpdateGoal($goalId: ID!, $input: UpdateGoalInput!) {
    updateGoal(goalId: $goalId, input: $input) {
      id
      status
      progressPercent
    }
  }
`;

export const DELETE_GOAL = gql`
  mutation DeleteGoal($goalId: ID!) {
    deleteGoal(goalId: $goalId)
  }
`;

export const EXERCISE_CATALOG = gql`
  query ExerciseCatalog($search: String) {
    exerciseCatalog(search: $search) {
      id
      name
      muscleGroup
      description
      isDefault
    }
  }
`;

export const MY_WORKOUT_PLANS = gql`
  query MyWorkoutPlans {
    myWorkoutPlans {
      id
      name
      description
      createdAt
      exercises {
        id
        exerciseId
        exerciseName
        muscleGroup
        sets
        reps
        suggestedWeight
        restSeconds
        orderIndex
      }
    }
  }
`;

export const WORKOUT_PLAN = gql`
  query WorkoutPlan($planId: ID!) {
    workoutPlan(planId: $planId) {
      id
      name
      description
      exercises {
        id
        exerciseId
        exerciseName
        muscleGroup
        sets
        reps
        suggestedWeight
        restSeconds
        orderIndex
      }
    }
  }
`;

export const CREATE_WORKOUT_PLAN = gql`
  mutation CreateWorkoutPlan($input: CreateWorkoutPlanInput!) {
    createWorkoutPlan(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_WORKOUT_PLAN = gql`
  mutation UpdateWorkoutPlan($planId: ID!, $input: UpdateWorkoutPlanInput!) {
    updateWorkoutPlan(planId: $planId, input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_WORKOUT_PLAN_EXERCISES = gql`
  mutation UpdateWorkoutPlanExercises(
    $planId: ID!
    $exercises: [WorkoutPlanExerciseInput!]!
  ) {
    updateWorkoutPlanExercises(planId: $planId, exercises: $exercises) {
      id
      exercises {
        id
        exerciseId
        exerciseName
        sets
        reps
        suggestedWeight
        restSeconds
        orderIndex
      }
    }
  }
`;

export const DELETE_WORKOUT_PLAN = gql`
  mutation DeleteWorkoutPlan($planId: ID!) {
    deleteWorkoutPlan(planId: $planId)
  }
`;

export const SCHEDULE_WORKOUT = gql`
  mutation ScheduleWorkout($input: ScheduleWorkoutInput!) {
    scheduleWorkout(input: $input) {
      id
      planId
      planName
      scheduledDate
      status
    }
  }
`;

export const WORKOUT_CALENDAR = gql`
  query WorkoutCalendar($year: Int!, $month: Int!) {
    workoutCalendar(year: $year, month: $month) {
      date
      scheduledCount
      completedCount
      missedCount
      status
      indicators {
        planName
        status
      }
    }
  }
`;

export const WORKOUT_STREAK = gql`
  query WorkoutStreak {
    workoutStreak
  }
`;

export const SCHEDULES_FOR_DATE = gql`
  query SchedulesForDate($date: String!) {
    schedulesForDate(date: $date) {
      id
      planId
      planName
      scheduledDate
      completed
      status
    }
  }
`;

export const START_WORKOUT_SESSION = gql`
  mutation StartWorkoutSession($planId: ID!, $scheduleId: ID) {
    startWorkoutSession(planId: $planId, scheduleId: $scheduleId) {
      id
      planName
      sets {
        id
        planExerciseId
        exerciseName
        setNumber
        completed
      }
    }
  }
`;

export const COMPLETE_WORKOUT_SET = gql`
  mutation CompleteWorkoutSet(
    $sessionId: ID!
    $planExerciseId: ID!
    $setNumber: Int!
  ) {
    completeWorkoutSet(
      sessionId: $sessionId
      planExerciseId: $planExerciseId
      setNumber: $setNumber
    ) {
      id
      completedAt
      sets {
        id
        completed
        setNumber
        exerciseName
      }
    }
  }
`;

export const CREATE_SUBMISSION = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
      weight
      reps
      videoUrl
      gymId
      exerciseId
      userId
      createdAt
    }
  }
`;

export const CITY_RANKINGS = gql`
  query CityRankings($category: RankingCategory!, $city: String) {
    cityRankings(category: $category, city: $city) {
      category
      city
      myRank
      myValue
      entries {
        rank
        userId
        name
        avatarUrl
        value
        unit
      }
    }
  }
`;

export const MY_RANKING_POSITIONS = gql`
  query MyRankingPositions {
    myRankingPositions {
      category
      rank
      value
      isTopOne
    }
  }
`;

export const DIET_DASHBOARD = gql`
  query DietDashboard($date: String) {
    dietDashboard(date: $date) {
      caloriesConsumed
      proteinG
      carbG
      fatG
      goal {
        id
        caloriesGoal
        proteinGoalG
        carbGoalG
        fatGoalG
        objective
        aiExplanation
      }
      meals {
        id
        name
        mealType
        eatenAt
        notes
        foods {
          id
          foodName
          quantityDescription
          calories
          proteinG
          carbG
          fatG
          fiberG
        }
      }
    }
  }
`;

export const DIET_WEEKLY_SUMMARY = gql`
  query DietWeeklySummary {
    dietWeeklySummary {
      date
      calories
      proteinG
      carbG
      fatG
    }
  }
`;

export const UPDATE_DIET_GOAL = gql`
  mutation UpdateDietGoal($input: UpdateDietGoalInput!) {
    updateDietGoal(input: $input) {
      id
      caloriesGoal
      proteinGoalG
      carbGoalG
      fatGoalG
      objective
      aiExplanation
    }
  }
`;

export const SUGGEST_DIET_GOAL = gql`
  mutation SuggestDietGoal($objective: String!) {
    suggestDietGoal(objective: $objective) {
      id
      caloriesGoal
      proteinGoalG
      carbGoalG
      fatGoalG
      objective
      aiExplanation
    }
  }
`;

export const SUGGEST_DIET_GOAL_WITH_AI = gql`
  mutation SuggestDietGoalWithAI($objective: String!) {
    suggestDietGoalWithAI(objective: $objective) {
      id
      caloriesGoal
      proteinGoalG
      carbGoalG
      fatGoalG
      objective
      aiExplanation
    }
  }
`;

export const CREATE_MEAL = gql`
  mutation CreateMeal($input: CreateMealInput!) {
    createMeal(input: $input) {
      id
      name
      mealType
      eatenAt
    }
  }
`;

export const DELETE_MEAL = gql`
  mutation DeleteMeal($mealId: ID!) {
    deleteMeal(mealId: $mealId)
  }
`;

export const ANALYZE_MEAL_PHOTO = gql`
  mutation AnalyzeMealPhoto($input: AnalyzeMealInput!) {
    analyzeMealPhoto(input: $input) {
      descricao
      erro
      confianca
      observacao
      totalCalorias
      totalProteina
      totalCarboidrato
      totalGordura
      totalFibra
      alimentos {
        nome
        quantidade_estimada
        calorias
        proteina_g
        carboidrato_g
        gordura_g
        fibra_g
      }
    }
  }
`;

export const POSTS_FEED = gql`
  query PostsFeed($city: String, $page: Int) {
    postsFeed(city: $city, page: $page) {
      hasMore
      page
      posts {
        id
        content
        createdAt
        tags
        likeCount
        commentCount
        likedByMe
        isOwner
        author {
          id
          name
          avatarUrl
          instagramUsername
        }
        lift {
          id
          weight
          reps
          exerciseName
        }
      }
    }
  }
`;

export const POST_COMMENTS = gql`
  query PostComments($postId: ID!) {
    postComments(postId: $postId) {
      id
      content
      createdAt
      author {
        id
        name
        avatarUrl
      }
      replies {
        id
        content
        createdAt
        author {
          id
          name
          avatarUrl
        }
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($q: String!) {
    searchUsers(q: $q) {
      id
      name
      avatarUrl
      instagramUsername
    }
  }
`;

export const MY_NOTIFICATIONS = gql`
  query MyNotifications {
    myNotifications {
      id
      type
      referenceId
      referenceType
      read
      createdAt
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      createdAt
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId)
  }
`;

export const TOGGLE_POST_LIKE = gql`
  mutation TogglePostLike($postId: ID!) {
    togglePostLike(postId: $postId)
  }
`;

export const CREATE_POST_COMMENT = gql`
  mutation CreatePostComment($postId: ID!, $input: CreatePostCommentInput!) {
    createPostComment(postId: $postId, input: $input) {
      id
      content
      createdAt
    }
  }
`;

export const REPORT_POST = gql`
  mutation ReportPost($postId: ID!, $input: ReportPostInput!) {
    reportPost(postId: $postId, input: $input)
  }
`;

export const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead($ids: [String!]) {
    markNotificationsRead(ids: $ids)
  }
`;

export const DELETE_WORKOUT_SCHEDULE = gql`
  mutation DeleteWorkoutSchedule($scheduleId: ID!) {
    deleteWorkoutSchedule(scheduleId: $scheduleId)
  }
`;

export const COMPLETE_WORKOUT_SCHEDULE = gql`
  mutation CompleteWorkoutSchedule($scheduleId: ID!) {
    completeWorkoutSchedule(scheduleId: $scheduleId) {
      id
      status
      completed
    }
  }
`;

export const MY_BATTLES = gql`
  query MyBattles {
    myBattles {
      id
      status
      type
      modality
      challengerBestKg
      challengedBestKg
      challengerBestVolume
      challengedBestVolume
      challengerAttemptCount
      challengedAttemptCount
      windowStart
      windowEnd
      deadline
      exerciseName
      provocationMessage
      createdAt
      acceptedAt
      winningSide
      challenger { id name avatarUrl instagramUsername }
      challenged { id name avatarUrl instagramUsername }
      winner { id name }
    }
  }
`;

export const ACTIVE_BATTLES = gql`
  query ActiveBattles {
    activeBattles {
      id
      status
      modality
      challengerBestKg
      challengedBestKg
      challengerBestVolume
      challengedBestVolume
      challengerAttemptCount
      challengedAttemptCount
      windowStart
      windowEnd
      deadline
      exerciseName
      winningSide
      challenger { id name avatarUrl instagramUsername }
      challenged { id name avatarUrl instagramUsername }
    }
  }
`;

export const PENDING_BATTLES_SUMMARY = gql`
  query PendingBattlesSummary {
    pendingBattlesSummary {
      total
      latest {
        id
        exerciseName
        provocationMessage
        windowStart
        windowEnd
        challenger { id name avatarUrl instagramUsername }
        challenged { id name avatarUrl instagramUsername }
      }
    }
  }
`;

export const BATTLE_HISTORY = gql`
  query BattleHistory($userId: ID) {
    battleHistory(userId: $userId) {
      id
      status
      modality
      exerciseName
      windowStart
      windowEnd
      challengerBestKg
      challengedBestKg
      challengerBestVolume
      challengedBestVolume
      challenger { id name instagramUsername }
      challenged { id name instagramUsername }
      winner { id name }
    }
  }
`;

export const USER_BATTLE_STATS = gql`
  query UserBattleStats($userId: ID) {
    userBattleStats(userId: $userId) {
      totalBattles
      wins
      losses
      draws
      winStreak
      bestWinStreak
      winRate
      favoriteExerciseName
    }
  }
`;

export const MARK_BATTLE_RESULTS_SEEN = gql`
  mutation MarkBattleResultsSeen {
    markBattleResultsSeen
  }
`;

export const CREATE_BATTLE = gql`
  mutation CreateBattle($input: CreateBattleInput!) {
    createBattle(input: $input) {
      id
      status
    }
  }
`;

export const ACCEPT_BATTLE = gql`
  mutation AcceptBattle($battleId: ID!) {
    acceptBattle(battleId: $battleId) {
      id
      status
    }
  }
`;

export const DECLINE_BATTLE = gql`
  mutation DeclineBattle($battleId: ID!) {
    declineBattle(battleId: $battleId) {
      id
      status
    }
  }
`;

export const MY_PRIVACY_SETTINGS = gql`
  query MyPrivacySettings {
    myPrivacySettings {
      publicCheckin
      publicProfile
      showInRankings
      autoBattlePosts
    }
  }
`;

export const UPDATE_PRIVACY_SETTINGS = gql`
  mutation UpdatePrivacySettings($input: UpdatePrivacyInput!) {
    updatePrivacySettings(input: $input) {
      publicCheckin
      publicProfile
      showInRankings
      autoBattlePosts
    }
  }
`;

export const CREATE_CHECKIN = gql`
  mutation CreateCheckin($input: CreateCheckinInput!) {
    createCheckin(input: $input) {
      id
      gymName
      checkedInAt
    }
  }
`;

export const ACTIVE_CHECKINS = gql`
  query ActiveCheckins($city: String) {
    activeCheckins(city: $city) {
      id
      gymName
      userName
      userAvatarUrl
      reactionCount
    }
  }
`;
