import Login from '@/pages/auth/Login';
import AuthCallback from '@/pages/auth/AuthCallback';
import Terms from '@/pages/auth/Terms';
import TermDetail from '@/pages/auth/TermDetail';

const BASE_PATH = '/auth';

export const authRoutes = [
  { path: `${BASE_PATH}/login`, element: <Login /> },
  { path: `${BASE_PATH}/callback`, element: <AuthCallback /> },
  { path: `${BASE_PATH}/terms`, element: <Terms /> },
  { path: `${BASE_PATH}/terms/:id`, element: <TermDetail /> },
];
