import { XGreyscale300Icon } from '@/assets/icons';
import type { TextInputProps } from './TextInput.type';

// todo: 최대글자 + 1개 입력되는 이슈
// todo: 클리어 버튼 눌렀을 때 글자 전부 지워지게 (onClear 동작)
const TextInput: React.FC<TextInputProps> = ({
  isTyping,
  isFocused,
  value,
  onChange,
  onFocus,
  onBlur,
  onClear,
  placeholder = '예시 문구',
  variant = 'full',
  error = false,
  errorMessage,
  maxLength,
}) => {
  // 간단한 상태 체크
  const isActive = isFocused || isTyping;
  const hasValue = !!value;
  const isEmpty = !hasValue && !isFocused;

  // 보더 색상 결정
  const getBorderColor = () => {
    if (error) return 'border-point-600';
    if (isActive) return 'border-primary-500';
    return 'border-greyscale-border-300';
  };

  return (
    <div className="w-full flex flex-col">
      <div
        className={`
        w-full relative flex items-center h-10 
        transition-all duration-200 border-solid
        ${
          variant === 'line'
            ? `border-b py-2 ${getBorderColor()}`
            : `border rounded-full px-3 py-2 ${getBorderColor()}`
        }
      `}
      >
        <div className="flex-1 flex items-center relative">
          <input
            type="text"
            value={value}
            placeholder={isFocused ? '' : placeholder}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            {...(maxLength !== undefined && { maxLength })}
            className={`
              w-full bg-transparent outline-none text-body1
              ${hasValue ? 'text-greyscale-text-body-900 font-semibold' : 'text-greyscale-text-disabled-500'}
              placeholder-transparent
            `}
          />

          {/* 커스텀 placeholder */}
          {isEmpty && (
            <div className="absolute left-0 pointer-events-none text-greyscale-text-disabled-500 text-body1">
              {placeholder}
            </div>
          )}
        </div>

        {/* 클리어 버튼 */}
        {isActive && (
          <button
            onClick={onClear}
            className="flex items-center justify-center w-5 h-5 ml-1 flex-shrink-0"
            type="button"
            tabIndex={-1}
          >
            <XGreyscale300Icon />
          </button>
        )}
      </div>

      {/* 하단 영역: 에러메시지 & 글자 수 카운터 */}
      <div
        className={`flex
        ${error && errorMessage ? 'justify-between' : 'justify-end'}
        items-start mt-1 gap-2`}
      >
        {/* 에러메시지 */}
        {error && errorMessage && (
          <p className="text-caption2 text-point-600 flex-1">{errorMessage}</p>
        )}

        {/* 글자 수 카운터 */}
        {maxLength !== undefined && (
          <p
            className={`text-caption2 shrink-0 ${
              (value?.length || 0) >= maxLength
                ? 'text-point-600'
                : 'text-greyscale-text-disabled-500'
            }`}
          >
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextInput;
