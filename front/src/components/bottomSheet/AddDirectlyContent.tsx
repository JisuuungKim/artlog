import Button from '@/components/button/Button';
import TextInput from '@/components/textInput';
import type { TextInputProps } from '@/components/textInput';

interface AddDirectlyContentProps {
  inputProps: Pick<
    TextInputProps,
    | 'isTyping'
    | 'isFocused'
    | 'value'
    | 'onChange'
    | 'onFocus'
    | 'onBlur'
    | 'onClear'
  >;
  onAdd: () => void;
  buttonText?: string;
  placeholder?: string;
  maxLength?: number;
}

export default function AddDirectlyContent({
  inputProps,
  onAdd,
  buttonText = '추가',
  placeholder = '이름을 입력해주세요',
  maxLength = 28,
}: AddDirectlyContentProps) {
  return (
    <div className="mb-5 flex w-full gap-2">
      <TextInput
        isTyping={inputProps.isTyping}
        isFocused={inputProps.isFocused}
        variant="full"
        value={inputProps.value}
        onChange={inputProps.onChange}
        onFocus={inputProps.onFocus}
        onBlur={inputProps.onBlur}
        onClear={inputProps.onClear}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <Button
        hierarchy="primary"
        size="medium"
        disabled={inputProps.value.trim() === ''}
        onClick={onAdd}
      >
        {buttonText}
      </Button>
    </div>
  );
}
