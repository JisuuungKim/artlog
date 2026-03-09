import type { ReactNode } from 'react';

export type AppBarVariant =
  | 'category-right-icons'
  | 'name-right-chip'
  | 'category-title-only'
  | 'category-left-back-right-chip'
  | 'title-left-close-right-chip'
  | 'title-left-right-icons'
  | 'title-left-back'
  | 'icons-left-right-single'
  | 'icons-left-right-double'
  | 'category-left-back-search'
  | 'icons-left-only';

export interface AppBarProps {
  variant: AppBarVariant;
  className?: string;
  title?: string;
  chipLabel?: string;
  onCategoryChevronClick?: () => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightSecondaryIcon?: ReactNode;
  searchValue?: string;
  searchPlaceholder?: string;
  hasNewNotifications?: boolean;
}
