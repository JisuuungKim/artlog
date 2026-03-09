import { XGreyscale800Icon } from '@assets/icons';
import type { LessonNoteProcessingCardProps } from './LessonNoteProcessingCard.types';

export default function LessonNoteProcessingCard({
  title = '레슨 노트 타이틀',
  progress = 40,
  remainingMinute = 0,
  onClose,
}: LessonNoteProcessingCardProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const remainingText = `약 ${remainingMinute}분 남았어요!`;

  return (
    <div className="w-full rounded-2xl bg-greyscale-bg-50 p-4">
      <div className="mb-[10px] flex items-start justify-between">
        <p className="max-w-[236px] truncate text-subtitle3 text-greyscale-text-title-800">
          {title}
        </p>
        <button type="button" className="h-5 w-5" onClick={onClose}>
          <XGreyscale800Icon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-label text-primary-500">
          <span>{clampedProgress}%</span>
          <span>·</span>
          <span>{remainingText}</span>
        </div>

        <div className="h-[10px] w-full overflow-hidden rounded-[100px] bg-greyscale-disabled-200">
          <div
            className="h-full rounded-[100px] bg-primary-500"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
