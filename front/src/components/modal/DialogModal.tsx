import Button from '@/components/button/Button';
import Checkbox from '@/components/checkbox';

export interface DialogModalProps {
  /** 모달의 타입 - 버튼 구성과 체크박스 여부를 결정 */
  type: 'single-button' | 'two-buttons' | 'two-buttons-with-checkbox';
  /** 모달 제목 */
  title: string;
  /** 모달 내용 */
  content: string;
  /** 체크박스 상태 (type이 'two-buttons-with-checkbox'일 때만 사용) */
  checkboxChecked?: boolean;
  /** 체크박스 onChange 핸들러 */
  onCheckboxChange?: (checked: boolean) => void;
  /** 체크박스 라벨 */
  checkboxLabel?: string;
  /** 첫 번째(왼쪽) 버튼 텍스트 */
  primaryButtonText?: string;
  /** 두 번째(오른쪽) 버튼 텍스트 */
  secondaryButtonText?: string;
  /** 첫 번째(왼쪽) 버튼 클릭 핸들러 */
  onPrimaryClick?: () => void;
  /** 두 번째(오른쪽) 버튼 클릭 핸들러 */
  onSecondaryClick?: () => void;
  /** 모달 표시 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose?: () => void;
}

export default function DialogModal({
  type,
  title,
  content,
  checkboxChecked = false,
  onCheckboxChange,
  checkboxLabel = '다시 보지 않기',
  primaryButtonText = '바로',
  secondaryButtonText = '바로',
  onPrimaryClick,
  onSecondaryClick,
  isOpen,
  onClose,
}: DialogModalProps) {
  if (!isOpen) return null;

  const renderButtons = () => {
    switch (type) {
      case 'single-button':
        return (
          <div className="mt-6">
            <Button
              hierarchy="primary"
              size="medium"
              onClick={onPrimaryClick}
              className="w-full"
            >
              {primaryButtonText}
            </Button>
          </div>
        );

      case 'two-buttons':
      case 'two-buttons-with-checkbox':
        return (
          <div className="flex gap-3 mt-6">
            <Button
              hierarchy="secondary-grey"
              size="medium"
              onClick={onSecondaryClick}
              className="flex-1"
            >
              {secondaryButtonText}
            </Button>
            <Button
              hierarchy="primary"
              size="medium"
              onClick={onPrimaryClick}
              className="flex-1"
            >
              {primaryButtonText}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-alpha-dimmed bg-opacity-50"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="relative bg-white rounded-2xl px-6 pb-6 pt-8 mx-9 max-w-sm w-full">
        {/* 제목 */}
        <h2 className="text-subtitle1 text-greyscale-text-title-900 text-center mb-2">
          {title}
        </h2>

        {/* 내용 */}
        <p className="text-body2 text-greyscale-neutral-600 text-center mb-4 whitespace-pre-line">
          {content}
        </p>

        {/* 체크박스 (type이 'two-buttons-with-checkbox'일 때만 표시) */}
        {type === 'two-buttons-with-checkbox' && onCheckboxChange && (
          <div className="mb-4 flex justify-center">
            <Checkbox
              checked={checkboxChecked}
              onChange={onCheckboxChange}
              label={checkboxLabel}
            />
          </div>
        )}

        {/* 버튼들 */}
        {renderButtons()}
      </div>
    </div>
  );
}
