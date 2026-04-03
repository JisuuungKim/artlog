import { BellGreyscale800Icon } from '@/assets/icons';

export default function NotificationEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 pb-24">
      <BellGreyscale800Icon className="h-9 w-9 opacity-30" />
      <p className="text-subtitle2 text-greyscale-text-disabled-500">
        새로운 알림이 없어요.
      </p>
    </div>
  );
}
