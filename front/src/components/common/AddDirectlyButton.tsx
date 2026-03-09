import { ArrowRightGreyscale500Icon } from '@/assets/icons';
import React from 'react';

interface AddDirectlyButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function AddDirectlyButton({
  onClick,
  children = '직접 추가',
  className = '',
  disabled = false,
}: AddDirectlyButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        border border-greyscale-border-300 h-9 flex items-center justify-center
        pl-4 pr-3 py-2 rounded-full transition-colors duration-200
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="flex gap-1 items-center">
        <span className="text-label text-greyscale-text-body-700">
          {children}
        </span>
        <div className="w-4 h-4 flex items-center justify-center">
          <ArrowRightGreyscale500Icon />
        </div>
      </div>
    </button>
  );
}
