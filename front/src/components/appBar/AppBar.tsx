import type { ReactNode } from 'react';
import {
  BackGreyscale800Icon,
  BellGreyscale800Icon,
  BellNewGreyscale800Icon,
  CalendarGreyscale800Icon,
  ArrowDownGreyscale500Icon,
  CloseGreyscale800Icon,
  PlaceholderDummyGreyscale700Icon,
  SearchGreyscale800Icon,
} from '@assets/icons';
import Chip from '@components/common/Chip';
import type { AppBarProps } from './AppBar.types';
import AppBarSearchField from './AppBarSearchField';

function Title({ children }: { children: ReactNode }) {
  return (
    <p className="text-subtitle1 tracking-[-0.5px] text-greyscale-text-title-900">
      {children}
    </p>
  );
}

function CategoryTitle({
  title = '카테고리명',
  onChevronClick,
}: {
  title?: string;
  onChevronClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-[6px]">
      <Title>{title}</Title>
      <button
        type="button"
        onClick={onChevronClick}
        className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-greyscale-border-300"
      >
        <ArrowDownGreyscale500Icon className="h-4 w-4" />
      </button>
    </div>
  );
}

function CenteredHeader({
  title,
  left,
  right,
}: {
  title: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    // <div className="px-5 py-2.5 w-full flex items-center justify-between">
    //   <div className="w-6 h-6">{left}</div>
    //   <div>{title}</div>
    //   <div>{right}</div>
    // </div>
    <div className="relative h-11 w-full">
      {left ? (
        <div className="absolute left-5 top-1/2 -translate-y-1/2">{left}</div>
      ) : null}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {title}
      </div>
      {right ? (
        <div className="absolute right-5 top-1/2 -translate-y-1/2">{right}</div>
      ) : null}
    </div>
  );
}

const DUMMY_ICON = <PlaceholderDummyGreyscale700Icon className="h-6 w-6" />;

export default function AppBar({
  variant,
  className = '',
  title,
  chipLabel,
  onCategoryChevronClick,
  leftIcon,
  rightIcon,
  rightSecondaryIcon,
  searchValue,
  searchPlaceholder,
  hasNewNotifications = false,
}: AppBarProps) {
  if (variant === 'category-right-icons') {
    return (
      <div
        className={`flex w-full items-center justify-between px-5 py-2 ${className}`}
      >
        <CategoryTitle
          title={title || '카테고리명'}
          onChevronClick={onCategoryChevronClick}
        />
        <div className="flex items-center gap-4">
          {rightIcon || <SearchGreyscale800Icon className="h-6 w-6" />}
          {rightSecondaryIcon || (
            <CalendarGreyscale800Icon className="h-6 w-6" />
          )}
          {hasNewNotifications ? (
            <BellNewGreyscale800Icon className="h-6 w-6" />
          ) : (
            <BellGreyscale800Icon className="h-6 w-6" />
          )}
        </div>
      </div>
    );
  }

  if (variant === 'name-right-chip') {
    return (
      <div
        className={`flex w-full items-center justify-between px-5 py-2 ${className}`}
      >
        <Title>{title || ''}</Title>
        <Chip>{chipLabel || ''}</Chip>
      </div>
    );
  }

  if (variant === 'category-title-only') {
    return (
      <div className={`flex w-full items-center px-5 py-2 ${className}`}>
        <CategoryTitle
          title={title || ''}
          onChevronClick={onCategoryChevronClick}
        />
      </div>
    );
  }

  if (variant === 'category-left-back-right-chip') {
    return (
      <div className={`w-full ${className}`}>
        <CenteredHeader
          left={leftIcon || <BackGreyscale800Icon />}
          title={
            <CategoryTitle
              title={title || ''}
              onChevronClick={onCategoryChevronClick}
            />
          }
          right={<Chip>{chipLabel || ''}</Chip>}
        />
      </div>
    );
  }

  if (variant === 'title-left-close-right-chip') {
    return (
      <div className={`w-full ${className}`}>
        <CenteredHeader
          left={leftIcon || <CloseGreyscale800Icon className="h-6 w-6" />}
          title={<Title>{title || '타이틀'}</Title>}
          right={<Chip>{chipLabel || '버튼'}</Chip>}
        />
      </div>
    );
  }

  if (variant === 'title-left-right-icons') {
    return (
      <div
        className={`flex w-full items-center justify-between px-5 py-2 ${className}`}
      >
        {leftIcon || DUMMY_ICON}
        <Title>{title || '타이틀'}</Title>
        {rightIcon || DUMMY_ICON}
      </div>
    );
  }

  if (variant === 'title-left-back') {
    return (
      <div className={`w-full ${className}`}>
        <CenteredHeader
          left={leftIcon || <BackGreyscale800Icon className="h-6 w-6" />}
          title={<Title>{title || '타이틀'}</Title>}
        />
      </div>
    );
  }

  if (variant === 'icons-left-right-single') {
    return (
      <div
        className={`flex w-full items-center justify-between px-5 py-[10px] ${className}`}
      >
        {leftIcon || DUMMY_ICON}
        {rightIcon || DUMMY_ICON}
      </div>
    );
  }

  if (variant === 'icons-left-right-double') {
    return (
      <div
        className={`flex w-full items-center justify-between px-5 py-[10px] ${className}`}
      >
        {leftIcon || DUMMY_ICON}
        <div className="flex items-center gap-4">
          {rightIcon || DUMMY_ICON}
          {rightSecondaryIcon || DUMMY_ICON}
        </div>
      </div>
    );
  }

  if (variant === 'category-left-back-search') {
    return (
      <div className={`w-full ${className}`}>
        <CenteredHeader
          left={leftIcon || <BackGreyscale800Icon className="h-6 w-6" />}
          title={
            <CategoryTitle
              title={title || '카테고리명'}
              onChevronClick={onCategoryChevronClick}
            />
          }
        />
        <div className="border-b border-greyscale-disabled-200 px-5 pb-3 pt-1">
          <AppBarSearchField
            value={searchValue}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full items-center px-5 py-[10px] ${className}`}>
      {leftIcon || DUMMY_ICON}
    </div>
  );
}
