export interface TextInputProps {
  isTyping: boolean;
  isFocused: boolean;
  variant: 'full' | 'line';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClear: () => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  maxLength?: number; // 미제공 시 카운터 숨김
}
