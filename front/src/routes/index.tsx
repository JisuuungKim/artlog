import { lessonRoutes } from './lesson';
import { noteRoutes } from './note';
import { authRoutes } from './auth';
import { onboardingRoutes } from './onboarding';

export const allRoutes = [
  ...lessonRoutes,
  ...noteRoutes,
  ...authRoutes,
  ...onboardingRoutes,
];
