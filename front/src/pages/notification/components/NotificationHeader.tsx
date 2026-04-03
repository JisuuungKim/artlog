import {
  BackGreyscale800Icon,
  EtcGreyscale800Icon,
} from '@/assets/icons';
import { useNavigate } from 'react-router-dom';

export default function NotificationHeader() {
  const navigate = useNavigate();

  return (
    <header className="relative h-11 w-full bg-greyscale-bg-50">
      <button
        type="button"
        aria-label="뒤로 가기"
        onClick={() => navigate(-1)}
        className="absolute left-5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
      >
        <BackGreyscale800Icon className="h-6 w-6" />
      </button>

      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-subtitle1 text-greyscale-text-title-900">
        알림
      </h1>

      <button
        type="button"
        aria-label="알림 설정"
        className="absolute right-5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
      >
        <EtcGreyscale800Icon className="h-6 w-6" />
      </button>
    </header>
  );
}
