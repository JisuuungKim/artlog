export type AudioUploadStatus = 'uploading' | 'done' | 'error';

interface AudioUploadProgressProps {
  fileName: string;
  progress: number; // 0 ~ 100
  status: AudioUploadStatus;
  onRetry?: () => void;
}

const STATUS_TEXT: Record<AudioUploadStatus, string> = {
  uploading: '업로드 중...',
  done: '업로드 완료',
  error: '업로드에 실패했어요',
};

export default function AudioUploadProgress({
  fileName,
  progress,
  status,
  onRetry,
}: AudioUploadProgressProps) {
  const isError = status === 'error';
  const barWidth = isError ? 100 : Math.min(Math.max(progress, 0), 100);

  return (
    <div className="rounded-2xl bg-white px-5 py-4">
      <p className="text-subtitle1 text-greyscale-text-title-900 truncate">
        {fileName}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <p
          className={`text-caption1 ${
            isError ? 'text-point-600' : 'text-greyscale-neutral-600'
          }`}
        >
          {STATUS_TEXT[status]}
        </p>
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-caption1 text-primary-500"
          >
            다시 시도
          </button>
        )}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-greyscale-disabled-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isError ? 'bg-point-600' : 'bg-primary-500'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
