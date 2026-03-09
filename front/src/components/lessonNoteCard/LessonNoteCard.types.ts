export interface LessonNoteCardProps {
  editMode?: boolean;
  selected?: boolean;
  isNew?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onEtcClick?: () => void;
}
