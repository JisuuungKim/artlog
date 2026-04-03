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
    Icon: () => React.JSX.Element;
  }
> = {
  'lesson-note': {
    label: '레슨 노트',
    Icon: LessonNoteIcon,
  },
  notice: {
    label: '공지',
    Icon: NoticeIcon,
  },
};

function LessonNoteIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <rect
        x="3.25"
        y="2.75"
        width="11.5"
        height="14.5"
        rx="2.25"
        stroke="#6C68D9"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 7.25H11.5"
        stroke="#6C68D9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.5 10.25H11.5"
        stroke="#6C68D9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 5.5L16.75 3.5V13.25A2.5 2.5 0 1 1 14.5 10.77V5.5Z"
        stroke="#6C68D9"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoticeIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M11.75 4.5a8.2 8.2 0 0 1-4.54 2.31l-1.78.29A1.75 1.75 0 0 0 4 8.82v2.36c0 .86.62 1.59 1.46 1.72l1.75.27a8.2 8.2 0 0 1 4.54 2.31V4.5Z"
        stroke="#6C68D9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.75 7H14a2 2 0 1 1 0 4h-2.25"
        stroke="#6C68D9"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.1 13.13 8.06 16"
        stroke="#6C68D9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NotificationItem({
  type,
  timeLabel,
  message,
  isHighlighted = false,
}: NotificationItemProps) {
  const { label, Icon } = NOTIFICATION_META[type];

  return (
    <article
      className={`px-5 py-5 ${isHighlighted ? 'bg-primary-50' : 'bg-greyscale-bg-50'}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon />
            <p className="w-[152px] text-caption1 text-greyscale-neutral-600">
              {label}
            </p>
          </div>
          <p className="w-[117px] text-right text-caption1 text-greyscale-neutral-600">
            {timeLabel}
          </p>
        </div>
        <div className="pl-7">
          <p className="whitespace-pre-line text-subtitle3 text-greyscale-text-body-700">
            {message}
          </p>
        </div>
      </div>
    </article>
  );
}
