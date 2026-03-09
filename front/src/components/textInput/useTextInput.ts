// useTextInput.ts
import { useState, useRef, useCallback } from 'react';

export const useTextInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 300);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);
  const onClear = useCallback(() => handleChange(''), [handleChange]);

  // 컴포넌트에서 필요한 것들을 딱 골라서 반환
  return {
    value,
    setValue: handleChange, // 수동으로 값을 바꿀 때 사용
    onClear,
    isFocused,
    isTyping,
    onChange,
    onFocus,
    onBlur,
  };
};
