import { CheckGreyscale50Icon } from '@/assets/icons';
import { EtcGreyscale500Icon, NewPrimary500Icon } from '@assets/icons';
import MiniTag from '@/components/miniTag';
import type { LessonNoteCardProps } from './LessonNoteCard.types';

export default function LessonNoteCard({
  editMode = false,
  selected = false,
  isNew = false,
  onSelectionChange,
  onEtcClick,
}: LessonNoteCardProps) {
  const handleCheckboxClick = () => {
    onSelectionChange?.(!selected);
  };

  return (
    <div className="bg-greyscale-bg-50 rounded-lg p-4 space-y-1 relative">
      {editMode && (
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
          onClick={handleCheckboxClick}
        >
          <div
            className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] mx-auto my-auto flex items-center justify-center ${
              selected
                ? 'bg-primary-500 border-primary-500'
                : 'border-greyscale-text-disabled-500'
            }`}
          >
            {selected && <CheckGreyscale50Icon />}
          </div>
        </div>
      )}
      <div
        className={`flex justify-between items-center ${editMode ? 'ml-10' : ''}`}
      >
        <div className="flex gap-0.5 items-center">
          <p className="text-subtitle3 text-greyscale-text-title-800">
            레슨 노트 타이틀
          </p>
          {isNew && (
            <div>
              <NewPrimary500Icon />
            </div>
          )}
        </div>
        <EtcGreyscale500Icon onClick={onEtcClick} />
      </div>
      <p
        className={`text-greyscale-neutral-600 text-caption1 ${editMode ? 'ml-10' : ''}`}
      >
        2025. 01. 01. 오후 5:09
      </p>
      <div className={`flex space-x-2 items-center ${editMode ? 'ml-10' : ''}`}>
        <MiniTag fill={false}>전체노트</MiniTag>
        <div className="w-px h-4 bg-greyscale-border-300"></div>
        <div className="flex space-x-1">
          <MiniTag>노래1</MiniTag>
          <MiniTag>노래2</MiniTag>
        </div>
      </div>
    </div>
  );
}
