import {
  BackGreyscale800Icon,
  CheckBgPrimary600Icon,
  PencilGreyscale800Icon,
} from '@/assets/icons';
import { Button } from '@/components/button';
import AppBar from '@/components/appBar';
import {
  AddDirectlyContent,
  BottomSheet,
} from '@/components/bottomSheet';
import { useRegisterUserInterestCategory } from '@/hooks/useNoteBrowser';
import { useTextInput } from '@/components/textInput';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_SELECTION_COUNT = 5;

const INTEREST_OPTIONS = ['보컬', '연기', '기타', '피아노', '우쿨렐레'] as const;
const DEFAULT_SELECTED_OPTIONS = [] as const;

type InterestOption = string;

interface InterestOptionButtonProps {
  label: string;
  selected?: boolean;
  trailingIcon?: ReactNode;
  onClick?: () => void;
}

function InterestOptionButton({
  label,
  selected = false,
  trailingIcon,
  onClick,
}: InterestOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2 rounded-2xl border px-4 py-[13px] text-left transition-colors ${
        selected
          ? 'border-primary-300 bg-primary-50 text-primary-600'
          : 'border-greyscale-border-300 bg-greyscale-bg-50 text-greyscale-text-body-700'
      }`}
    >
      <span className="flex-1 text-subtitle3">{label}</span>
      {trailingIcon ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
}

export default function Interests() {
  const navigate = useNavigate();
  const interestInput = useTextInput('');
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([
    ...INTEREST_OPTIONS,
  ]);
  const [selectedOptions, setSelectedOptions] = useState<InterestOption[]>(
    [...DEFAULT_SELECTED_OPTIONS] as InterestOption[]
  );
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const registerUserInterestCategory = useRegisterUserInterestCategory();

  const hasSelection = selectedOptions.length > 0;

  const handleOptionToggle = (option: InterestOption) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      }

      if (prev.length >= MAX_SELECTION_COUNT) {
        return prev;
      }

      return [...prev, option];
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleBottomSheetClose = () => {
    interestInput.onClear();
    interestInput.onBlur();
    setIsBottomSheetOpen(false);
  };

  const handleDirectAddOpen = () => {
    setIsBottomSheetOpen(true);
  };

  const handleDirectAddSubmit = () => {
    const newInterest = interestInput.value.trim();

    if (!newInterest || registerUserInterestCategory.isPending) {
      return;
    }

    registerUserInterestCategory.mutate(
      { name: newInterest },
      {
        onSuccess: category => {
          setInterestOptions(prev =>
            prev.includes(category.name) ? prev : [...prev, category.name]
          );
          setSelectedOptions(prev => {
            if (prev.includes(category.name)) {
              return prev;
            }

            if (prev.length >= MAX_SELECTION_COUNT) {
              return prev;
            }

            return [...prev, category.name];
          });
          handleBottomSheetClose();
        },
      }
    );
  };

  const handleStart = () => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-greyscale-bg-50">
      <div className="shrink-0 pt-[10px]">
        <AppBar
          variant="icons-left-only"
          leftIcon={
            <button
              type="button"
              onClick={handleBack}
              className="flex h-6 w-6 items-center justify-center"
              aria-label="뒤로가기"
            >
              <BackGreyscale800Icon className="h-6 w-6" />
            </button>
          }
        />
      </div>

      <div className="flex-1 px-5 pb-[132px] pt-[36px]">
        <section className="mb-9">
          <h1 className="text-h1 text-greyscale-text-title-900">
            어떤 분야의 레슨을
            <br />
            분석해 드릴까요?
          </h1>
          <p className="mt-3 text-body1 text-greyscale-neutral-600">
            최대 {MAX_SELECTION_COUNT}개 선택 가능해요.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <InterestOptionButton
            label="직접 추가"
            trailingIcon={<PencilGreyscale800Icon className="h-6 w-6" />}
            onClick={handleDirectAddOpen}
          />

          {interestOptions.map(option => {
            const isSelected = selectedOptions.includes(option);

            return (
              <InterestOptionButton
                key={option}
                label={option}
                selected={isSelected}
                trailingIcon={
                  isSelected ? (
                    <CheckBgPrimary600Icon className="h-5 w-5" />
                  ) : undefined
                }
                onClick={() => handleOptionToggle(option)}
              />
            );
          })}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[480px] bg-greyscale-bg-50 px-5 pb-[26px] pt-5">
        <Button
          hierarchy="primary"
          size="large"
          className="w-full"
          disabled={!hasSelection}
          onClick={handleStart}
        >
          시작하기
        </Button>
      </div>

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleBottomSheetClose}
        title="카테고리 직접 추가하기"
        buttonText="확인"
        showButton={false}
      >
        <AddDirectlyContent
          inputProps={{
            isTyping: interestInput.isTyping,
            isFocused: interestInput.isFocused,
            value: interestInput.value,
            onChange: interestInput.onChange,
            onFocus: interestInput.onFocus,
            onBlur: interestInput.onBlur,
            onClear: interestInput.onClear,
          }}
          onAdd={handleDirectAddSubmit}
          placeholder="카테고리 이름을 입력해주세요"
          maxLength={20}
        />
      </BottomSheet>
    </div>
  );
}
