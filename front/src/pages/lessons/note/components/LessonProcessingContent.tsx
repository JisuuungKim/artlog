import { Button } from '@/components/button';

interface LessonProcessingContentProps {
  remainingMinutes?: number;
  onCancel?: () => void;
  isCancelling?: boolean;
  onSetupPush?: () => void;
}

function ProgressBar({ progress = 0.4 }: { progress?: number }) {
  return (
    <div className="h-[10px] w-full overflow-hidden rounded-full bg-greyscale-disabled-200">
      <div
        className="h-full rounded-full bg-primary-500"
        style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
      />
    </div>
  );
}

export default function LessonProcessingContent({
  remainingMinutes = 7,
  onCancel,
  isCancelling = false,
  onSetupPush,
}: LessonProcessingContentProps) {
  return (
    <div className="flex min-h-[calc(100vh-280px)] flex-col px-5 pb-5 pt-[148px]">
      <div className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-[303px] space-y-10 text-center">
          <div className="space-y-2">
            <p className="text-subtitle1 text-greyscale-text-title-800">
              <span className="text-primary-500">레슨 내용 받아쓰기</span> 중...
            </p>
            <p className="text-body2 text-greyscale-neutral-600">
              네트워크가 끊기면 분석이 취소될 수 있어요.
            </p>
          </div>

          <div className="space-y-3">
            <ProgressBar />
            <p className="text-label">
              <span className="text-greyscale-text-disabled-500">약 </span>
              <span className="text-primary-400">{remainingMinutes}분</span>
              <span className="text-greyscale-text-disabled-500">
                {' '}
                남았어요!
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-4 pt-10">
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
