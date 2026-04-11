import { LessonEmptyGreyscale500Icon } from '@/assets/icons';

export function LessonEmptyState() {
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <div className="flex h-9 w-9 items-center justify-center">
        <LessonEmptyGreyscale500Icon className="h-[27px] w-[27px] text-greyscale-text-disabled-500" />
      </div>
      <div className="flex w-full flex-col items-center gap-1.5">
        <p className="text-subtitle1 text-greyscale-text-body-700">
          아직 기록된 레슨이 없어요
        </p>
        <p className="text-body2 w-full text-greyscale-neutral-600">
          첫 번째 레슨을 분석하고 실력을 쑥쑥 키워보세요!
        </p>
      </div>
    </div>
  );
}
