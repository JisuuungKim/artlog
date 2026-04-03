import { useSearchParams } from 'react-router-dom';
import NotificationEmptyState from './components/NotificationEmptyState';
import NotificationHeader from './components/NotificationHeader';
import NotificationItem from './components/NotificationItem';

type NotificationData = {
  id: number;
  type: 'lesson-note' | 'notice';
  timeLabel: string;
  message: string;
  isHighlighted?: boolean;
};

const MOCK_NOTIFICATIONS: NotificationData[] = [
  {
    id: 1,
    type: 'lesson-note',
    timeLabel: '5분 전',
    message: '요청하신 레슨 노트 분석이 완료되었어요.',
    isHighlighted: true,
  },
  {
    id: 2,
    type: 'lesson-note',
    timeLabel: '2시간 전',
    message: '레슨 노트 제작이 지연되고 있어요.\n조금만 더 기다려주세요.',
    isHighlighted: true,
  },
  {
    id: 3,
    type: 'notice',
    timeLabel: '1일 전',
    message: '서비스 점검이 3월 28일 오전 2시에 진행될 예정이에요.',
  },
  {
    id: 4,
    type: 'notice',
    timeLabel: '3일 전',
    message: '아트로그 업데이트 소식이 도착했어요.\n새로운 기능을 확인해보세요.',
  },
];

export default function NotificationPage() {
  const [searchParams] = useSearchParams();
  const isEmptyPreview = searchParams.get('empty') === 'true';
  const notifications = isEmptyPreview ? [] : MOCK_NOTIFICATIONS;
  const hasNotifications = notifications.length > 0;

  return (
    <div className="min-h-screen bg-greyscale-bg-50">
      <NotificationHeader />

      <main className="flex min-h-[calc(100vh-44px)] flex-col">
        {hasNotifications ? (
          <section className="flex-1 pt-8">
            <div className="divide-y divide-greyscale-disabled-200">
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

        <footer className="px-5 pb-18 pt-6 text-center text-caption2 text-greyscale-text-disabled-500">
          최근 7일 간의 알림을 확인할 수 있어요.
        </footer>
      </main>
    </div>
  );
}
