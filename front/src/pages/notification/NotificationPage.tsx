import AppBar from '@/components/appBar';
import { BackGreyscale800Icon } from '@/assets/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NotificationEmptyState from './components/NotificationEmptyState';
import NotificationItem from './components/NotificationItem';
import { useNotifications, type NotificationItem as RawNotification } from '@/hooks/useNotifications';

type NotificationData = {
  id: number;
  type: 'lesson-note' | 'notice';
  timeLabel: string;
  message: string;
  isHighlighted?: boolean;
};

function toTimeLabel(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function toNotificationType(type: string): 'lesson-note' | 'notice' {
  return type === 'notice' ? 'notice' : 'lesson-note';
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
        stroke="#2E2E38"
        strokeWidth="1.8"
      />
      <path
        d="M19.07 13.06c.04-.35.06-.7.06-1.06s-.02-.71-.06-1.06l2.01-1.57a.48.48 0 0 0 .11-.61l-1.9-3.29a.48.48 0 0 0-.58-.21l-2.37.95a8 8 0 0 0-1.84-1.06l-.36-2.52A.48.48 0 0 0 13.66 2h-3.32a.48.48 0 0 0-.47.4l-.36 2.52c-.65.25-1.27.6-1.84 1.06L5.3 5.03a.48.48 0 0 0-.58.21L2.82 8.53a.48.48 0 0 0 .11.61l2.01 1.57c-.04.35-.06.7-.06 1.06s.02.71.06 1.06l-2.01 1.57a.48.48 0 0 0-.11.61l1.9 3.29c.12.21.37.3.58.21l2.37-.95c.57.46 1.19.81 1.84 1.06l.36 2.52c.04.23.24.4.47.4h3.32c.23 0 .43-.17.47-.4l.36-2.52c.65-.25 1.27-.6 1.84-1.06l2.37.95c.21.09.46 0 .58-.21l1.9-3.29a.48.48 0 0 0-.11-.61l-2.01-1.57Z"
        stroke="#2E2E38"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmptyPreview = searchParams.get('empty') === 'true';
  const { data: rawNotifications = [] } = useNotifications();

  const notifications: NotificationData[] = isEmptyPreview
    ? []
    : rawNotifications.map((n: RawNotification) => ({
        id: n.id,
        type: toNotificationType(n.type),
        timeLabel: toTimeLabel(n.createdAt),
        message: n.message,
        isHighlighted: !n.isRead,
      }));

  const hasNotifications = notifications.length > 0;

  return (
    <div className="min-h-screen bg-greyscale-bg-50">
      <AppBar
        variant="title-left-right-icons"
        title="알림"
        leftIcon={<BackGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
        rightIcon={<SettingsIcon />}
        rightIconClick={() => navigate('/notification/settings')}
      />

      <main className="flex min-h-[calc(100vh-44px)] flex-col pt-[54px]">
        {hasNotifications ? (
          <section className="flex-1">
            <div>
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  type={notification.type}
                  timeLabel={notification.timeLabel}
                  message={notification.message}
                  isHighlighted={notification.isHighlighted}
                />
              ))}
            </div>
          </section>
        ) : (
          <NotificationEmptyState />
        )}

        <footer className="mt-auto px-5 pb-[26px] pt-8 text-center text-caption1 text-greyscale-neutral-600">
          최근 7일 간의 알림을 확인할 수 있어요.
        </footer>
      </main>
    </div>
  );
}
