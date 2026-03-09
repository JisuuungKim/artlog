import React from 'react';
import type { CardListItemProps } from './CardList.types';
import { DottPrimary500Icon } from '@/assets/icons';

const CardListItem: React.FC<CardListItemProps> = ({
  data,
  index = 0,
  showTitle = true,
  showNumbering = false,
  isLastItem = false,
}) => {
  return (
    <div
      className={`flex items-center ${
        !isLastItem ? 'border-b border-greyscale-disabled-200' : ''
      }`}
    >
      <div className="flex flex-row items-center flex-1">
        <div className="flex flex-1 gap-3 py-5 items-start">
          {/* 넘버링 또는 도트 영역 */}
          <div className="flex flex-col items-center">
            {showNumbering ? (
              <>
                {/* 넘버링 상단 여백 */}
                <div className="h-1 w-3.5" />
                <div className="bg-primary-500 flex items-center justify-center px-1.5 py-0.5 rounded-full w-5 h-5">
                  <span className="text-caption2 text-greyscale-bg-50 overflow-hidden text-ellipsis">
                    {index + 1}
                  </span>
                </div>
              </>
            ) : (
              <div
                className={`flex items-center ${showTitle ? 'py-2.5' : 'py-1.5'}`}
              >
                <div className="w-2 h-2">
                  <DottPrimary500Icon />
                </div>
              </div>
            )}
          </div>

          {/* 콘텐츠 영역 */}
          {showTitle ? (
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="text-subtitle2 text-greyscale-text-title-900">
                {data.title || '타이틀'}
              </h3>
              <p className="text-body2 text-greyscale-neutral-600">
                {data.content}
              </p>
            </div>
          ) : (
            <p className="text-body2 text-greyscale-text-title-800 flex-1">
              {data.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardListItem;
