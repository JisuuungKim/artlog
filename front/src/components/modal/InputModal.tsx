import { useEffect } from 'react';
import TextInput from '@/components/textInput/TextInput';
import { useTextInput } from '@/components/textInput/useTextInput';
import Button from '@/components/button/Button';

export interface InputModalProps {
  isOpen: boolean;
  /** 모달 제목 */
  title: string;
  /** 인풋 placeholder */
  placeholder?: string;
  /**
   * 인풋 스타일 variant (기본값: 'line')
   * - 'line': 하단 보더만 표시
   * - 'full': pill 형태 보더
   */
  variant?: 'line' | 'full';
  /** 글자 수 제한. 제공 시 카운터 표시 */
  maxLength?: number;
  /** 취소 버튼 텍스트 (기본값: '취소') */
  cancelText?: string;
  /** 확인 버튼 텍스트 (기본값: '확인') */
  confirmText?: string;
  /** 인풋 초기값 (편집 시 기존 값 전달) */
  defaultValue?: string;
  /** 오버레이 / 취소 버튼 클릭 */
  onClose?: () => void;
  /** 확인 버튼 클릭 — 현재 입력값 전달 */
  onConfirm?: (value: string) => void;
}

export function InputModal({
  isOpen,
  title,
  placeholder,
  variant = 'line',
  maxLength,
  defaultValue = '',
  cancelText = '취소',
  confirmText = '확인',
  onClose,
  onConfirm,
}: InputModalProps) {
  const textInput = useTextInput('');

  // 열릴 때마다 defaultValue로 초기화
  useEffect(() => {
    if (isOpen) textInput.setValue(defaultValue);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-alpha-dimmed bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative bg-greyscale-bg-50 rounded-[20px] px-6 pb-6 pt-8 mx-9 max-w-sm w-full flex flex-col gap-6">
        {/* 제목 + 인풋 */}
        <div className="flex flex-col gap-3">
          <h2 className="text-subtitle2 text-greyscale-text-title-900">
            {title}
          </h2>
          <TextInput
            {...textInput}
            variant={variant}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button
            hierarchy="secondary-grey"
            size="medium"
            onClick={onClose}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            hierarchy="primary"
            size="medium"
            onClick={() => onConfirm?.(textInput.value)}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
