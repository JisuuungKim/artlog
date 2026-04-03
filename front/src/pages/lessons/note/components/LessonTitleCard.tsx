import {
  ArrowDownGreyscale800Icon,
  ArrowRightGreyscale500Icon,
} from '@/assets/icons';
import Chip from '@/components/common/Chip';
import MiniTag from '@/components/miniTag';

interface LessonTitleCardProps {
  title: string;
  formattedDate: string;
  folderName: string;
  lessonSongs: string[];
  conditionText: string;
  isExpanded: boolean;
  showAllSongs: boolean;
  onToggleExpanded: () => void;
  onToggleSongs: () => void;
  categoryLabel?: string;
}

function LessonMetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-3">
      <div className="flex flex-col">
        <div className="h-1.5" />
        <div className="flex items-center gap-0.5">
          <p className="max-w-[48px] truncate text-label text-greyscale-text-disabled-500">
            {label}
          </p>
          <ArrowRightGreyscale500Icon className="h-4 w-4 text-greyscale-text-disabled-500" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function LessonTitleCard({
  title,
  formattedDate,
  folderName,
  lessonSongs,
  conditionText,
  isExpanded,
  showAllSongs,
  onToggleExpanded,
  onToggleSongs,
  categoryLabel = '카테고리 없음',
}: LessonTitleCardProps) {
  return (
    <div className="flex flex-col gap-6 p-5 pb-7 pt-3">
      <div className="flex flex-col gap-2">
        <div>
          <MiniTag fill={false}>{categoryLabel}</MiniTag>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="max-w-[288px] truncate text-subtitle1 text-greyscale-text-title-900">
              {title}
            </h1>
            <div className="flex items-center gap-0.5 text-caption1 text-greyscale-neutral-600">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>1시간</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="transition-transform duration-200"
          >
            <ArrowDownGreyscale800Icon
              className={`h-6 w-6 text-greyscale-text-disabled-500 transition-transform duration-200 ${
                isExpanded ? '' : 'rotate-180'
              }`}
            />
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="flex flex-col gap-4">
          <LessonMetaRow label="폴더">
            <Chip variant="filter">{folderName}</Chip>
          </LessonMetaRow>

          <LessonMetaRow label="레슨 곡">
            {lessonSongs.length >= 2 && !showAllSongs ? (
              <>
                <Chip variant="filter">{lessonSongs[0]}</Chip>
                <Chip variant="default" onClick={onToggleSongs}>
                  +{lessonSongs.length - 1}
                </Chip>
              </>
            ) : (
              <>
                {lessonSongs.map(song => (
                  <Chip key={song} variant="filter">
                    {song}
                  </Chip>
                ))}
                {lessonSongs.length >= 2 && showAllSongs ? (
                  <Chip variant="default" onClick={onToggleSongs}>
                    접기
                  </Chip>
                ) : null}
              </>
            )}
          </LessonMetaRow>

          <LessonMetaRow label="컨디션">
            <Chip variant="default">{conditionText}</Chip>
          </LessonMetaRow>
        </div>
      ) : null}
    </div>
  );
}
