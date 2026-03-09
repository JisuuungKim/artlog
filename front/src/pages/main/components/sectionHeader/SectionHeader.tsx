import {
  ArrowDownGreyscale500Icon,
  PlusGreyscale500Icon,
} from '@/assets/icons';
import type { SectionHeaderProps } from './SectionHeader.types';

export function SectionHeader({
  title,
  isPlusIcon = false,
  isOpen = true,
  onPlusClick,
  onArrowClick,
  className,
}: SectionHeaderProps) {
  return (
    <div className={`flex justify-between mb-3 ${className ?? ''}`}>
      <p className="text-label text-greyscale-neutral-600">{title}</p>
      <div className="flex gap-2.5">
        {isPlusIcon && (
          <button type="button" onClick={onPlusClick}>
            <PlusGreyscale500Icon className="h-5 w-5" />
          </button>
        )}
        <button type="button" onClick={onArrowClick}>
          <ArrowDownGreyscale500Icon
            className={`h-5 w-5 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
