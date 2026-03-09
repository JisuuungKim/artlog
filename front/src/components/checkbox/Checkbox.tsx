import { CheckGreyscale50Icon } from '@/assets/icons';

type CheckboxSize = 'small' | 'medium' | 'large';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: CheckboxSize;
  disabled?: boolean;
  className?: string;
}

const sizeConfig: Record<
  CheckboxSize,
  { box: string; icon: string; text: string }
> = {
  small: {
    box: 'w-[15px] h-[15px] rounded-[4.167px] border-[1.25px]',
    icon: 'size-5',
    text: 'text-caption1 text-greyscale-text-body-700',
  },
  medium: {
    box: 'w-[18px] h-[18px] rounded-[5px] border-[1.5px]',
    icon: 'size-6',
    text: 'text-body2 text-greyscale-text-title-800 flex-1',
  },
  large: {
    box: 'w-[18px] h-[18px] rounded-[5px] border-[1.5px]',
    icon: 'size-6',
    text: 'text-subtitle3 text-greyscale-text-title-800 flex-1',
  },
};

export default function Checkbox({
  checked,
  onChange,
  label,
  size = 'small',
  disabled = false,
  className = '',
}: CheckboxProps) {
  const { box, icon, text } = sizeConfig[size];

  const handleToggle = () => {
    if (!disabled) onChange(!checked);
  };

  return (
    <div
      className={`flex items-center gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleToggle}
    >
      {/* 체크박스 아이콘 영역 */}
      <div className={`relative shrink-0 overflow-clip ${icon}`}>
        <div
          className={`absolute inset-0 m-auto ${box} flex items-center justify-center transition-colors duration-200 ${
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'bg-transparent border-greyscale-border-300'
          }`}
        >
          {checked && <CheckGreyscale50Icon />}
        </div>
      </div>

      {/* 라벨 */}
      {label && <span className={`${text}`}>{label}</span>}
    </div>
  );
}
