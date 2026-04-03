import { FolderGreyscale800Icon, TrashcanPoint600Icon } from '@/assets/icons';

interface NoteSelectionBottomBarProps {
  disabled: boolean;
  onMove: () => void;
  onDelete: () => void;
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
  textClassName,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  textClassName: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`flex items-center justify-center gap-1 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      <span className={`text-subtitle3 ${textClassName}`}>{label}</span>
    </button>
  );
}

export default function NoteSelectionBottomBar({
  disabled,
  onMove,
  onDelete,
}: NoteSelectionBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-greyscale-bg-50">
      <div className="grid h-12 grid-cols-2 border-t border-greyscale-disabled-200 px-8">
        <ActionButton
          label="폴더 이동"
          icon={<FolderGreyscale800Icon className="h-6 w-6" />}
          disabled={disabled}
          onClick={onMove}
          textClassName="text-greyscale-text-title-800"
        />
        <ActionButton
          label="삭제"
          icon={<TrashcanPoint600Icon className="h-6 w-6" />}
          disabled={disabled}
          onClick={onDelete}
          textClassName="text-point-600"
        />
      </div>
      <div className="h-[26px]" />
    </div>
  );
}
