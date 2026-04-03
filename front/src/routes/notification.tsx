import NotificationPage from '@/pages/notification/NotificationPage';
import NotificationSettingsPage from '@/pages/notification/NotificationSettingsPage';

const BASE_PATH = '/notification';

export const notificationRoutes = [
  { path: BASE_PATH, element: <NotificationPage /> },
  { path: `${BASE_PATH}/settings`, element: <NotificationSettingsPage /> },
];
