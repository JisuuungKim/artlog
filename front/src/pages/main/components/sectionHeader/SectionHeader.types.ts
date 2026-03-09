export interface SectionHeaderProps {
  title: string;
  isPlusIcon?: boolean;
  isOpen?: boolean;
  onPlusClick?: () => void;
  onArrowClick?: () => void;
  className?: string;
}
