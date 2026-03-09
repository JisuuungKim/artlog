import { PlusGreyscale500Icon } from '@/assets/icons';
import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'filled' | 'selected' | 'filter';
  showNumber?: boolean;
  number?: number;
  showIcon?: boolean;
  icon?: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  iconOnly?: boolean;
  showDot?: boolean;
  onClick?: () => void;
}

export default function Chip({
  children,
  variant = 'default',
  showNumber = false,
  number,
  showIcon = false,
  icon: IconComponent = PlusGreyscale500Icon,
  iconOnly = false,
  showDot = false,
  onClick,
}: ChipProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'selected':
        return 'bg-primary-500 text-greyscale-bg-50';
      case 'filled':
        return 'bg-greyscale-disabled-200 text-greyscale-text-title-800';
      case 'filter':
        return 'bg-primary-50 border border-primary-300 text-greyscale-text-title-800';
      default:
        return 'border border-greyscale-border-300 text-greyscale-text-title-800';
    }
  };

  const getDotColor = () => {
    return variant === 'selected' ? 'bg-greyscale-bg-50' : 'bg-primary-500';
  };

  const getIconColor = () => {
    if (variant === 'selected') return '#F9F9FB';
    return '#8D8D9A';
  };

  const getNumberColor = () => {
    return variant === 'selected' ? 'text-greyscale-bg-50' : 'text-primary-500';
  };

  const baseClasses = `
        inline-flex items-center justify-center
        rounded-full text-caption1
        ${iconOnly ? 'p-2' : 'px-3 py-1.5'}
        ${getVariantClasses()}
        ${onClick ? 'cursor-pointer' : ''}
    `
    .trim()
    .replace(/\s+/g, ' ');

  const renderContent = () => {
    if (iconOnly) {
      return (
        <IconComponent className="w-4 h-4" style={{ color: getIconColor() }} />
      );
    }

    return (
      <div className="flex items-center gap-1">
        {showDot && (
          <div className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
        )}

        {!iconOnly && <span className="truncate">{children}</span>}

        {showNumber && number !== undefined && (
          <span className={getNumberColor()}>{number}</span>
        )}

        {showIcon && !iconOnly && IconComponent && (
          <IconComponent
            className="w-4 h-4 ml-0.5"
            style={{ color: getIconColor() }}
          />
        )}
      </div>
    );
  };

  return (
    <button className={baseClasses} onClick={onClick} type="button">
      {renderContent()}
    </button>
  );
}
