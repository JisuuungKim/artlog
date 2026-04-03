export interface LessonNoteCardProps {
  title?: string;
  createdAt?: string;
  folderName?: string;
  songTitles?: string[];
  onClick?: () => void;
  editMode?: boolean;
  selected?: boolean;
  isNew?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onEtcClick?: () => void;
  showEtcButton?: boolean;
}
