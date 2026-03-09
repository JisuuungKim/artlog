import Button from '@/components/button/Button';
import TextInput, { useTextInput } from '@/components/textInput';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ConditionMemoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const conditionInput = useTextInput('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const memo = searchParams.get('memo') || '';
    conditionInput.setValue(memo);
  }, [location.search]);

  const handleComplete = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('memo', conditionInput.value);
    navigate(`/lessons/new?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col bg-greyscale-bg-50 min-h-screen pb-12 px-5">
      <div className="my-8 flex-1">
        <TextInput
          isTyping={conditionInput.isTyping}
          isFocused={conditionInput.isFocused}
          onFocus={conditionInput.onFocus}
          onBlur={conditionInput.onBlur}
          onClear={conditionInput.onClear}
          value={conditionInput.value}
          onChange={conditionInput.onChange}
          placeholder="컨디션 메모하기"
          variant="full"
          maxLength={20}
        />
      </div>
      <div className="my-5 self-end">
        <Button
          hierarchy="primary"
          size="medium"
          onClick={handleComplete}
          disabled={conditionInput.value.trim() === ''}
        >
          작성완료
        </Button>
      </div>
    </div>
  );
}
