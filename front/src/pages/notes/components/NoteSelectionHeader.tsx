import { FolderGreyscale800Icon, XGreyscale800Icon } from '@/assets/icons';

interface NoteSelectionHeaderProps {
  folderName: string;
  selectedCount: number;
  onClose: () => void;
  onToggleSelectAll: () => void;
}

export default function NoteSelectionHeader({
  folderName,
  selectedCount,
  onClose,
  onToggleSelectAll,
}: NoteSelectionHeaderProps) {
  const hasSelection = selectedCount > 0;

  return (
    <>
      <div className="relative h-11">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
          aria-label="선택 종료"
        >
          <XGreyscale800Icon className="h-6 w-6" />
        </button>

        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-subtitle1 text-greyscale-text-title-900">
          {hasSelection ? `${selectedCount}개 노트` : '노트 선택'}
        </p>

        <button
          type="button"
          onClick={onToggleSelectAll}
          className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-greyscale-border-300 px-3 py-1.5 text-caption1 text-greyscale-text-title-800"
        >
          {hasSelection ? '선택 취소' : '전체 선택'}
        </button>
      </div>

      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-1">
          <FolderGreyscale800Icon className="h-6 w-6" />
          <span className="text-h2 text-greyscale-text-title-900">
            {folderName}
          </span>
        </div>
      </div>
    </>
  );
}
