import { BellGreyscale800Icon, MusicGreyscale800Icon } from '@/assets/icons';

type NotificationType = 'lesson-note' | 'notice';

interface NotificationItemProps {
  type: NotificationType;
  timeLabel: string;
  message: string;
  isHighlighted?: boolean;
}

const NOTIFICATION_META: Record<
  NotificationType,
  {
    label: string;
    Icon: typeof BellGreyscale800Icon;
  }
> = {
  'lesson-note': {
    label: '레슨 노트',
    Icon: MusicGreyscale800Icon,
  },
  notice: {
    label: '공지',
    Icon: BellGreyscale800Icon,
  },
};

export default function NotificationItem({
  type,
  timeLabel,
  message,
  isHighlighted = false,
}: NotificationItemProps) {
  const { label, Icon } = NOTIFICATION_META[type];

  return (
    <article
      className={`px-5 py-4 ${isHighlighted ? 'bg-primary-50' : 'bg-greyscale-bg-50'}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-5 w-5 shrink-0" />
        <p className="text-caption1 text-greyscale-text-disabled-500">
          {label}
        </p>
        <span className="text-caption1 text-greyscale-text-disabled-500">
          ·
        </span>
        <p className="text-caption1 text-greyscale-text-disabled-500">
          {timeLabel}
        </p>
      </div>
      <p className="whitespace-pre-line text-subtitle3 text-greyscale-text-body-700">
        {message}
      </p>
    </article>
  );
}
