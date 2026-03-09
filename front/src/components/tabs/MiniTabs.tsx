import React from 'react';
import type { MiniTabsProps } from './MiniTabs.types';

// todo: 하단 바 글씨 크기에 맞게 조절하기 ..
const MiniTabs: React.FC<MiniTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  const tabWidth = 100 / tabs.length; // 각 탭의 너비 (%)

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 탭 버튼들 */}
      <div className="flex items-center gap-3">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;

          return (
            <div
              key={tab.id}
              className="flex-1 flex items-center justify-center py-0.5 cursor-pointer"
              onClick={() => onTabChange(tab.id)}
            >
              <span
                className={
                  isActive
                    ? 'text-subtitle3 text-greyscale-text-title-900'
                    : 'text-body1 text-greyscale-disabled-500'
                }
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 하단 바 */}
      <div className="relative h-px w-full">
        <div
          className="absolute h-full bg-greyscale-text-title-900 transition-all duration-200"
          style={{
            width: `${tabWidth}%`,
            left: `${activeIndex * tabWidth}%`,
          }}
        />
      </div>
    </div>
  );
};

export default MiniTabs;
