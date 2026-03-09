import React from 'react';
import type { ButtonProps } from './Button.types';

const Button: React.FC<ButtonProps> = ({
  hierarchy = 'primary',
  size = 'large',
  iconPosition = 'none',
  disabled = false,
  children,
  onClick,
  iconOnClick,
  className = '',
  icon,
}) => {
  // 크기별 스타일 정의
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 'h-9',
          padding:
            iconPosition === 'none'
              ? 'px-4 py-2'
              : iconPosition === 'leading'
                ? 'pl-3 pr-4 py-2'
                : 'pl-4 pr-3 py-2',
          text: 'text-subtitle3',
          iconSize: 'size-4',
        };
      case 'medium':
        return {
          height: 'h-10',
          padding:
            iconPosition === 'none'
              ? 'px-6 py-2'
              : iconPosition === 'leading'
                ? 'pl-[18px] pr-6 py-2'
                : 'pl-6 pr-[18px] py-2',
          text: 'text-subtitle2',
          iconSize: 'size-5',
        };
      case 'large':
      default:
        return {
          height: 'h-12',
          padding:
            iconPosition === 'none'
              ? 'px-6 py-3'
              : iconPosition === 'leading'
                ? 'pl-5 pr-6 py-3'
                : 'pl-6 pr-5 py-3',
          text: 'text-label',
          iconSize: 'size-6',
        };
    }
  };

  // 계층별 색상 스타일 정의
  const getHierarchyStyles = () => {
    if (disabled) {
      return {
        background: 'bg-greyscale-disabled-200',
        text: 'text-greyscale-text-disabled-500',
        border: '',
        hover: '',
      };
    }

    switch (hierarchy) {
      case 'primary':
        return {
          background: 'bg-primary-500',
          text: 'text-greyscale-bg-50',
          border: '',
        };
      case 'secondary-color':
        return {
          background: 'bg-greyscale-bg-50',
          text: 'text-primary-500',
          border: 'border border-primary-300',
        };
      case 'secondary-grey':
        return {
          background: 'bg-greyscale-disabled-200',
          text: 'border border-greyscale-disabled-200 text-greyscale-text-body-700',
          border: '',
        };
      case 'default':
      default:
        return {
          background: 'bg-greyscale-disabled-200',
          text: 'text-greyscale-text-disabled-500',
          border: '',
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const hierarchyStyles = getHierarchyStyles();

  const baseStyles = `
    inline-flex items-center justify-center gap-1 
    rounded-full transition-all duration-200
    text-label
    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
  `;

  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles.height}
    ${sizeStyles.padding}
    ${sizeStyles.text}
    ${hierarchyStyles.background}
    ${hierarchyStyles.text}
    ${hierarchyStyles.border}
    ${disabled ? '' : hierarchyStyles.hover}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  const renderIcon = () => {
    if (!icon || iconPosition === 'none') return null;

    return (
      <span className={sizeStyles.iconSize} onClick={iconOnClick}>
        {icon}
      </span>
    );
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {iconPosition === 'leading' && renderIcon()}
      <span className="flex-shrink-0 text-label">{children}</span>
      {iconPosition === 'trailing' && renderIcon()}
    </button>
  );
};

export default Button;
