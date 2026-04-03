import { BackGreyscale800Icon } from '@/assets/icons';
import AppBar from '@/components/appBar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WithdrawReasonActionBar from './components/WithdrawReasonActionBar';
import WithdrawReasonOption from './components/WithdrawReasonOption';

const WITHDRAW_REASONS = [
  '더 이상 레슨을 받지 않아요.',
  '레슨노트 분석 결과가 만족스럽지 않아요.',
  '수기 노트나 메모장으로도 충분해요.',
  '앱 오류가 잦거나 속도가 느려요.',
  '무료로 제공되는 분석 횟수가 부족해요.',
  '기타',
] as const;

export default function WithdrawReason() {
  const navigate = useNavigate();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const handleToggleReason = (reason: string) => {
    setSelectedReasons(current =>
      current.includes(reason)
        ? current.filter(item => item !== reason)
        : [...current, reason],
    );
  };

  const hasSelectedReason = selectedReasons.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-greyscale-bg-50 pt-[10px]">
      <AppBar
        variant="title-left-back"
        title="회원 탈퇴"
        leftIcon={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-6 w-6 items-center justify-center"
            aria-label="뒤로가기"
          >
            <BackGreyscale800Icon className="h-6 w-6" />
          </button>
        }
      />

      <div className="flex-1 px-5 pb-[132px] pt-8">
        <section className="space-y-2.5">
          <h1 className="text-h2 text-greyscale-text-title-900">
            탈퇴 사유를 알려 주세요.
          </h1>
          <p className="text-body1 text-greyscale-neutral-600">
            해당하는 이유를 여러 개 선택할 수 있어요.
          </p>
        </section>

        <section className="space-y-2 pt-10">
          {WITHDRAW_REASONS.map(reason => (
            <WithdrawReasonOption
              key={reason}
              label={reason}
              selected={selectedReasons.includes(reason)}
              onClick={() => handleToggleReason(reason)}
            />
          ))}
        </section>
      </div>

      {!hasSelectedReason ? (
        <p className="fixed bottom-[118px] left-0 right-0 text-center text-caption1 text-point-600">
          탈퇴 사유를 선택해 주세요.
        </p>
      ) : null}

      <WithdrawReasonActionBar enabled={hasSelectedReason} />
    </div>
  );
}
