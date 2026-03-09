import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../button/Button';
import { BackGreyscale800Icon, XGreyscale800Icon } from '@/assets/icons';

type HeaderType = 'center' | 'left';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showHandle?: boolean;
  children?: React.ReactNode;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  maxHeight?: string;
  headerType?: HeaderType;
  onBack?: () => void;
  showHeader?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title = '제목',
  showHandle = true,
  children,
  buttonText = '확인',
  onButtonClick,
  maxHeight = '586px',
  showButton = true,
  headerType = 'center',
  onBack,
  showHeader = true,
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 약간의 지연 후 애니메이션 시작
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // 애니메이션 완료 후 DOM에서 제거
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  // 드래그 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setDragCurrentY(touch.clientY);
    setIsDragging(true);
  };

  // 드래그 중
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - dragStartY;

    // 아래쪽으로만 드래그 허용
    if (deltaY > 0) {
      setDragCurrentY(currentY);
      e.preventDefault(); // 스크롤 방지
    }
  };

  // 드래그 끝
  const handleTouchEnd = () => {
    if (dragStartY === null || dragCurrentY === null) return;

    const deltaY = dragCurrentY - dragStartY;
    const threshold = 100; // 100px 이상 드래그하면 닫기

    if (deltaY > threshold) {
      onClose();
    }

    // 상태 초기화
    setDragStartY(null);
    setDragCurrentY(null);
    setIsDragging(false);
  };

  // 드래그 거리 계산
  const getDragOffset = () => {
    if (dragStartY === null || dragCurrentY === null || !isDragging) return 0;
    const deltaY = dragCurrentY - dragStartY;
    return Math.max(0, deltaY); // 아래쪽으로만
  };

  const content = (
    <div
      className={`
        fixed inset-0 z-50 flex items-end justify-center
        transition-all duration-300 ease-out
        ${isAnimating ? 'bg-alpha-dimmed' : 'bg-transparent'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          w-full max-w-md bg-greyscale-bg-50 rounded-t-[24px] flex flex-col
          ${isDragging ? '' : 'transition-transform duration-300 ease-out'}
          ${isAnimating && !isDragging ? 'translate-y-0' : !isAnimating && !isDragging ? 'translate-y-full' : ''}
        `}
        style={{
          transform: isDragging
            ? `translateY(${getDragOffset()}px)`
            : isAnimating
              ? 'translateY(0px)'
              : 'translateY(100%)',
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div
            className="h-3 overflow-hidden relative shrink-0 w-full cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-greyscale-border-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {showHeader &&
          (headerType === 'center' ? (
            // Center-aligned header (첫 번째 디자인)
            <div className="flex items-center justify-between px-5 py-4 w-full">
              <div className="w-6"></div>
              <h2 className="text-subtitle3 text-greyscale-text-title-900 text-center flex-1">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-6 h-6"
              >
                <XGreyscale800Icon />
              </button>
            </div>
          ) : (
            // Left-aligned header with back button (두 번째 디자인)
            <div className="flex items-center justify-between px-5 py-4 w-full">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-6 h-6"
              >
                <BackGreyscale800Icon />
              </button>
              <h2 className="text-subtitle3 text-greyscale-text-title-900 flex-1 ml-4">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-6 h-6"
              >
                <XGreyscale800Icon />
              </button>
            </div>
          ))}

        {/* Content */}
        {children && (
          <div
            className="bg-greyscale-bg-50 flex flex-col overflow-x-hidden overflow-y-auto px-5 pt-5 shrink-0"
            style={{ maxHeight }}
          >
            {children}
          </div>
        )}

        {/* Button */}
        {showButton && (
          <div className="bg-greyscale-bg-50 p-5 flex flex-col">
            <Button size="large" onClick={handleButtonClick}>
              {buttonText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Portal을 사용하여 body에 렌더링
  return createPortal(content, document.body);
}
