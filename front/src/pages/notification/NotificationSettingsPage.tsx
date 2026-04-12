import AppBar from '@/components/appBar';
import { BackGreyscale800Icon } from '@/assets/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function NotificationToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="노트 분석 및 공지 알림"
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-12 rounded-full transition-colors ${
        checked ? 'bg-primary-500' : 'bg-greyscale-disabled-200'
      }`}
    >
      <span
        className={`absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-greyscale-bg-50 transition-all ${
          checked ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  return (
    <div className="min-h-screen bg-greyscale-bg-50">
      <AppBar
        variant="title-left-back"
        title="푸시 알림 설정"
        leftIcon={<BackGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
      />

      <main className="px-5 pt-11">
        <section className="flex items-center justify-between gap-4 py-10">
          <div className="max-w-64">
            <h1 className="text-subtitle2 font-medium tracking-[-0.02em] text-greyscale-text-title-800">
              노트 분석 · 공지 알림
            </h1>
            <p className="mt-1 text-caption1 text-greyscale-neutral-600">
              레슨 분석 결과와 서비스의 주요 공지를 알려드려요.
            </p>
          </div>
          <NotificationToggle
            checked={isNotificationEnabled}
            onChange={setIsNotificationEnabled}
          />
        </section>
      </main>
    </div>
  );
}
