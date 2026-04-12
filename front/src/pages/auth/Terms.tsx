import { useState } from 'react';
import {
  ArrowRightGreyscale500Icon,
  BackGreyscale800Icon,
} from '@/assets/icons';
import AppBar from '@/components/appBar';
import Checkbox from '@/components/checkbox';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/button';

type ChecklistKey = 'terms' | 'privacy' | 'age' | 'marketing';

const CHECKLIST_ITEMS: {
  key: ChecklistKey;
  label: string;
  required: boolean;
  path?: string;
}[] = [
  {
    key: 'terms',
    label: '(필수) 서비스 이용약관',
    required: true,
    path: '/auth/terms/1',
  },
  {
    key: 'privacy',
    label: '(필수) 개인정보 수집 · 이용 동의',
    required: true,
    path: '/auth/terms/2',
  },
  { key: 'age', label: '(필수) 만 14세 이상입니다.', required: true },
  {
    key: 'marketing',
    label: '(선택) 마케팅 정보 수신 및 활용',
    required: false,
    path: '/auth/terms/3',
  },
];

const INITIAL_CHECKLIST = Object.fromEntries(
  CHECKLIST_ITEMS.map(({ key }) => [key, false])
) as Record<ChecklistKey, boolean>;

export default function Terms() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);

  const isAllChecked = CHECKLIST_ITEMS.filter(item => item.required).every(
    item => checklist[item.key]
  );

  const handleAllCheck = () => {
    const next = !isAllChecked;
    setChecklist(
      Object.fromEntries(
        CHECKLIST_ITEMS.map(({ key }) => [key, next])
      ) as Record<ChecklistKey, boolean>
    );
  };

  const handleCheck = (key: ChecklistKey) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col">
      <AppBar
        variant="icons-left-only"
        leftIcon={<BackGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
      />
      <p className="text-h1 text-greyscale-text-title-900 px-5 py-8">
        아트로그 사용을 위해
        <br />
        이용 약관에 동의해주세요.
      </p>
      <div className="flex flex-col gap-4 px-5 py-20 flex-1">
        <Checkbox
          checked={isAllChecked}
          onChange={handleAllCheck}
          label="전체 동의"
          size="large"
        />
        <hr className="border-greyscale-disabled-200 py-1" />
        {CHECKLIST_ITEMS.map(({ key, label, path }) => (
          <div key={key} className="flex justify-between items-center">
            <Checkbox
              checked={checklist[key]}
              onChange={() => handleCheck(key)}
              label={label}
              size="medium"
            />
            {path && (
              <ArrowRightGreyscale500Icon
                className="h-4 w-4"
                onClick={() => navigate(path)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="px-5 pt-5 pb-6">
        <Button
          hierarchy="primary"
          size="large"
          disabled={!isAllChecked}
          onClick={() => navigate('/onboarding/interests')}
          className="w-full"
        >
          동의하고 계속하기
        </Button>
      </div>
    </div>
  );
}
