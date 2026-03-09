import { XGreyscale800Icon } from '@assets/icons';
import type { LessonNoteFailedCardProps } from './LessonNoteFailedCard.types';

export default function LessonNoteFailedCard({
  title = '레슨 노트 타이틀',
  retryLabel = '다시 시도',
  onRetry,
  onClose,
}: LessonNoteFailedCardProps) {
  return (
    <div className="w-full rounded-2xl border border-greyscale-border-300 bg-greyscale-disabled-200 p-4">
      <div className="mb-4 flex items-start justify-between">
        <p className="max-w-[236px] truncate text-subtitle3 text-greyscale-text-disabled-500">
          {title}
        </p>
        <button type="button" className="h-5 w-5" onClick={onClose}>
          <XGreyscale800Icon className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        className="w-full rounded-[100px] bg-primary-500 px-3 py-1.5 text-caption1 text-greyscale-bg-50"
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    </div>
  );
}
