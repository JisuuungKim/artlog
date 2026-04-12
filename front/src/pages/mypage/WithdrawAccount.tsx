import { BackGreyscale800Icon } from '@/assets/icons';
import AppBar from '@/components/appBar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WithdrawActionBar from './components/WithdrawActionBar';
import WithdrawNoticeList from './components/WithdrawNoticeList';

function WithdrawTitle() {
  return (
    <section>
      <h1 className="text-h2 text-greyscale-text-title-900">
        아트로그를 탈퇴하고
        <br />
        모든 레슨노트를 삭제하시겠어요?
      </h1>
    </section>
  );
}

export default function WithdrawAccount() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const handleNext = () => navigate('/mypage/withdraw-reason');

  return (
    <div className="flex min-h-screen flex-col bg-greyscale-bg-50 pt-[10px]">
      <AppBar
        variant="title-left-back"
        title="회원 탈퇴"
        leftIcon={<BackGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
      />

      <div className="flex-1 px-5 pb-[132px] pt-8">
        <WithdrawTitle />
        <section className="pt-7">
          <WithdrawNoticeList />
        </section>
      </div>

      <WithdrawActionBar
        agreed={agreed}
        onAgreeChange={setAgreed}
        onNext={handleNext}
      />
    </div>
  );
}
