export interface LessonNoteCardProps {
  title?: string;
  createdAt?: string;
  folderName?: string;
  songTitles?: string[];
  editMode?: boolean;
  selected?: boolean;
  isNew?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onEtcClick?: () => void;
}
