import { ArrowRightGreyscale500Icon } from '@/assets/icons';
import AppBar from '@/components/appBar';
import { ListItem } from '@/components/listItem';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';

const TOTAL_COUNT = 4;

interface MypageSectionItem {
  label: string;
  onClick?: () => void;
}

interface MypageSectionProps {
  title: string;
  items: readonly MypageSectionItem[];
}

interface UsageCardProps {
  remainingCount: number;
  renewalDate: string;
}

function UsageCard({ remainingCount, renewalDate }: UsageCardProps) {
  const progressWidth = `${(remainingCount / TOTAL_COUNT) * 100}%`;

  return (
    <div className="rounded-[20px] bg-greyscale-bg-100 p-5">
      <div className="mb-3 flex items-center gap-0.5">
        <p className="text-subtitle3 text-greyscale-text-title-800">
          남은 횟수{' '}
          <span className="text-primary-500">{remainingCount}</span>
          <span className="text-greyscale-text-disabled-500">
            /{TOTAL_COUNT}회
          </span>
        </p>
        <ArrowRightGreyscale500Icon className="h-5 w-5 shrink-0" />
      </div>

      <div className="space-y-2">
        <div className="h-3 overflow-hidden rounded-full bg-greyscale-border-300">
          <div
            className="h-full rounded-full bg-primary-500"
            style={{ width: progressWidth }}
          />
        </div>
        <p className="text-caption1 text-greyscale-neutral-600">
          갱신 예정일 {renewalDate}
        </p>
      </div>
    </div>
  );
}

function MypageSection({ title, items }: MypageSectionProps) {
  return (
    <section className="px-5">
      <p className="mb-2.5 text-caption1 text-greyscale-text-disabled-500">
        {title}
      </p>
      <div>
        {items.map(item => (
          <ListItem
            key={item.label}
            label={item.label}
            trailing={<ArrowRightGreyscale500Icon className="h-5 w-5" />}
            onClick={item.onClick}
          />
        ))}
      </div>
    </section>
  );
}

function toRenewalDate(lastResetDate: string | null | undefined): string {
  if (!lastResetDate) return '-';
  const d = new Date(lastResetDate);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
}

export default function Mypage() {
  const navigate = useNavigate();
  const { data: user } = useUser();

  const remainingCount = user?.remainingCount ?? 0;
  const renewalDate = toRenewalDate(user?.lastResetDate as string | null | undefined);
  const userName = user?.name ?? '';

  const managementItems: readonly MypageSectionItem[] = [
    {
      label: '이용 현황',
      onClick: () => navigate('/mypage/usage-status'),
    },
    {
      label: '1:1 문의',
      onClick: () => navigate('/mypage/inquiry'),
    },
  ];

  const serviceItems: readonly MypageSectionItem[] = [
    { label: '이용약관' },
    { label: '개인정보 처리 방침' },
    { label: '오픈소스 라이선스' },
  ];

  return (
    <div className="min-h-screen bg-greyscale-bg-50 pt-[6px]">
      <AppBar variant="name-right-chip" title={userName} chipLabel="계정 정보" />

      <div className="pt-5">
        <section className="px-5">
          <UsageCard remainingCount={remainingCount} renewalDate={renewalDate} />
          <p className="pt-3 text-center text-caption2 text-greyscale-text-disabled-500">
            1회당 최대 1시간 분량까지 업로드 가능해요.
          </p>
        </section>

        <div className="pt-12">
          <MypageSection title="이용 관리" items={managementItems} />
        </div>

        <div className="pt-12">
          <MypageSection title="서비스 정보" items={serviceItems} />
        </div>

        <footer className="px-5 pb-18 pt-16 text-center text-caption2 text-greyscale-text-disabled-500">
          <p>현재 버전 1.0.0.</p>
          <p className="mt-1">이메일 ㅣ support@artlog.com</p>
        </footer>
      </div>
    </div>
  );
}
