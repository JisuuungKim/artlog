import React from 'react';
import { LyricsGreyscaleBg50Icon } from '@assets/icons';

interface LyricsButtonProps {
  onClick?: () => void;
  className?: string;
}

const LyricsButton: React.FC<LyricsButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <div className="absolute z-50 right-5 bottom-12-safe">
      <button
        className={`bg-primary-500 flex gap-1 items-center px-3.5 py-3 rounded-full ${className}`}
        onClick={onClick}
      >
        {/* 아이콘 */}
        <div className="w-4.5 h-4.5 flex-shrink-0">
          <LyricsGreyscaleBg50Icon aria-hidden className="h-full w-full" />
        </div>

        {/* 텍스트 */}
        <span className="text-label text-greyscale-bg-50">가사 보기</span>
      </button>
    </div>
  );
};

export default LyricsButton;
