export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; password?: string };
  ForgotPassword: { email?: string };
  ResetPassword: { email: string; code: string };
};

export type MainTabParamList = {
  HomeStack: undefined;
  CoursesStack: undefined;
  AIChat: undefined;
  Leaderboard: undefined;
  ProfileStack: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Playground: undefined;
  Shorts: undefined;
  Founders: undefined;
  RoadmapDetail: { roadmapId: string };
  BattleLobby: undefined;
  BattleMatching: { mode: '1v1' | '2v2' | '4v4' };
  BattleArena: { mode: '1v1' | '2v2' | '4v4'; players: any[] };
  BattleResult: { mode: '1v1' | '2v2' | '4v4'; status: 'victory' | 'defeat'; xpEarned: number };
};

export type CourseStackParamList = {
  Courses: { category?: string } | undefined;
  CourseDetail: { courseId: string };
  VideoPlayer: { videoId: string; courseId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  MyCourses: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Certificates: undefined;
  Follow: { tab?: 'followers' | 'following' };
  Referrals: undefined;
  Analytics: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Subscription: undefined;
  DailyChallenge: undefined;
};
