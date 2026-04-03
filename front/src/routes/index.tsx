import { lessonRoutes } from './lesson';
import { noteRoutes } from './note';
import { authRoutes } from './auth';
import { onboardingRoutes } from './onboarding';
import { mypageRoutes } from './mypage';
import { notificationRoutes } from './notification';
import { searchRoutes } from './search';

export const allRoutes = [
  ...lessonRoutes,
  ...noteRoutes,
  ...authRoutes,
  ...onboardingRoutes,
  ...mypageRoutes,
  ...notificationRoutes,
  ...searchRoutes,
];
