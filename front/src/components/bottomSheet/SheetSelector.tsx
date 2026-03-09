import {
  AddCategoryGreyscale300Icon,
  CheckBgPrimary600Icon,
} from '@/assets/icons';
import type { SheetOption } from './';

interface CategorySelectorProps {
  selected: string;
  onSelect: (category: string) => void;
  options?: SheetOption[];
  onAddCategory?: () => void;
  addCategoryLabel?: string;
  activeTextColor?: string;
  /** 현재 위치 항목 ID - 선택 상태와 무관하게 항상 text-greyscale-border-300으로 표시 */
  currentId?: string;
}

export default function SheetSelector({
  selected,
  onSelect,
  options = [],
  onAddCategory,
  addCategoryLabel = '카테고리 추가하기',
  activeTextColor = 'text-primary-600',
  currentId,
}: CategorySelectorProps) {
  return (
    <div className="w-full">
      <div className="border border-greyscale-border-300 rounded-2xl overflow-hidden mb-3">
        {options.map((option, index) => (
          <div
            key={option.id}
            className={`
                flex items-center px-4 py-3 cursor-pointer transition-colors
                ${index !== options.length - 1 ? 'border-b border-greyscale-border-300' : ''}
                ${selected === option.id ? 'bg-primary-50' : ''}
              `}
            onClick={() => onSelect(option.id)}
          >
            <span
              className={`
                  flex-1 text-subtitle3 tracking-tight
                  ${
                    option.id === currentId
                      ? 'text-greyscale-border-300'
                      : selected === option.id
                        ? activeTextColor
                        : 'text-greyscale-text-body-700'
                  }
                `}
            >
              {option.name}
            </span>
            {selected === option.id && (
              <div className="flex items-center justify-center">
                <CheckBgPrimary600Icon />
              </div>
            )}
          </div>
        ))}
      </div>
      {onAddCategory && (
        <button
          type="button"
          onClick={onAddCategory}
          className="flex w-full items-center gap-2 overflow-hidden rounded-2xl border border-greyscale-border-300 px-4 py-3 justify-between"
        >
          <span className="text-subtitle3 text-greyscale-text-body-700">
            {addCategoryLabel}
          </span>
          <AddCategoryGreyscale300Icon className="h-6 w-6 shrink-0" />
        </button>
      )}
    </div>
  );
}
