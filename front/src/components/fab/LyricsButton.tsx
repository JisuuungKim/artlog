import React from 'react';

const lyricsIcon =
  'http://localhost:3845/assets/5f85c358115243d589e61ecf574b353ed379fbcd.svg';

interface LyricsButtonProps {
  onClick?: () => void;
  className?: string;
}

const LyricsButton: React.FC<LyricsButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <div className="absolute z-50 right-5 bottom-12">
      <button
        className={`bg-primary-500 flex gap-1 items-center px-3.5 py-3 rounded-full ${className}`}
        onClick={onClick}
      >
        {/* 아이콘 */}
        <div className="w-4.5 h-4.5 flex-shrink-0">
          <img src={lyricsIcon} alt="가사 아이콘" className="w-full h-full" />
        </div>

        {/* 텍스트 */}
        <span className="text-label text-greyscale-bg-50">가사 보기</span>
      </button>
    </div>
  );
};

export default LyricsButton;
