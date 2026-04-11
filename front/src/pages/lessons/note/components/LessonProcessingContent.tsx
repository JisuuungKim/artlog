import { Button } from '@/components/button';

interface LessonProcessingContentProps {
  progress?: number;
  message?: string;
  onCancel?: () => void;
  isCancelling?: boolean;
  onSetupPush?: () => void;
}

function ProgressBar({ progress = 5 }: { progress?: number }) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="h-[10px] w-full overflow-hidden rounded-full bg-greyscale-disabled-200">
      <div
        className="h-full rounded-full bg-primary-500"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}

export default function LessonProcessingContent({
  progress = 5,
  message = '레슨노트를 준비하고 있어요.',
  onCancel,
  isCancelling = false,
  onSetupPush,
}: LessonProcessingContentProps) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-5">
      <div className="flex flex-1 flex-col justify-center items-center">
        <div className="w-full max-w-[303px] space-y-10 text-center">
          <div className="space-y-2">
            <p className="text-subtitle1 text-greyscale-text-title-800">
              {message}
            </p>
            <p className="text-body2 text-greyscale-neutral-600">
              완성되면 바로 확인할 수 있어요.
            </p>
          </div>

          <div className="space-y-3">
            <ProgressBar progress={progress} />
            <p className="text-label text-primary-400">
              {Math.max(0, Math.min(100, progress))}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-4">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onSetupPush}
            className="border-b border-greyscale-neutral-600 text-caption1 text-greyscale-neutral-600"
          >
            푸시 알림 설정하기
          </button>
        </div>

        <Button
          hierarchy="secondary-grey"
          size="large"
          className="w-full"
          onClick={onCancel}
          disabled={isCancelling}
        >
          노트 분석 취소하기
        </Button>
      </div>
    </div>
  );
}
