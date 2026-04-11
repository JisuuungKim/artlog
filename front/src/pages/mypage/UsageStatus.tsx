import { BackGreyscale800Icon } from '@/assets/icons';
import AppBar from '@/components/appBar';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';

const TOTAL_COUNT = 4;

function toRenewalDate(lastResetDate: string | null | undefined): string {
  if (!lastResetDate) return '-';
  const d = new Date(lastResetDate);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
}

const USAGE_NOTICES = [
  '매월 4회 레슨 노트를 만들 수 있어요. 남은 횟수는 다음 달에 초기화돼요.',
  '1회당 최대 1시간 분량까지 업로드 가능해요.',
  '업로드 실패 시 횟수는 차감되지 않아요.',
] as const;

interface InfoBlockProps {
  label: string;
  value: string;
}

function InfoBlock({ label, value }: InfoBlockProps) {
  return (
    <section>
      <p className="text-caption1 text-greyscale-text-disabled-500">{label}</p>
      <p className="mt-2 text-subtitle3 text-greyscale-text-title-900">
        {value}
      </p>
    </section>
  );
}

export default function UsageStatus() {
  const navigate = useNavigate();
  const { data: user } = useUser();

  const remainingCount = user?.remainingCount ?? 0;
  const monthlyUsage = `${remainingCount}/${TOTAL_COUNT}회`;
  const renewalDate = toRenewalDate(user?.lastResetDate);

  const handleBack = () => {
    navigate('/?tab=mypage');
  };

  return (
    <div className="min-h-screen bg-greyscale-bg-50 pt-[10px]">
      <AppBar
        variant="title-left-back"
        title="이용 현황"
        leftIcon={
          <button
            type="button"
            onClick={handleBack}
            className="flex h-6 w-6 items-center justify-center"
            aria-label="마이페이지로 돌아가기"
          >
            <BackGreyscale800Icon className="h-6 w-6" />
          </button>
        }
      />

      <div className="pt-8">
        <div className="space-y-8 px-5">
          <InfoBlock label="이번달 사용량" value={monthlyUsage} />
          <InfoBlock
            label="사용량 갱신일"
            value={renewalDate}
          />
        </div>

        <div className="mt-11 h-2 bg-greyscale-bg-100" />

        <section className="px-5 py-8">
          <ul className="space-y-4 pl-5 text-body2 leading-5 text-greyscale-text-body-700">
            {USAGE_NOTICES.map(notice => (
              <li key={notice} className="list-disc">
                {notice}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
