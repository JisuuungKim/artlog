import type { TabsProps } from './Tabs.types';

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  const tabWidth = 100 / tabs.length; // 각 탭의 너비 (%)

  return (
    <div className="flex flex-col w-full">
      {/* 탭 버튼들 */}
      <div className="flex w-full">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 h-9 flex items-center justify-center
                text-subtitle3 transition-colors
                ${
                  isActive
                    ? 'text-greyscale-text-title-800'
                    : 'text-greyscale-neutral-600'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 하단 바 */}
      <div className="relative h-0.5 w-full">
        <div
          className="absolute h-full bg-greyscale-text-title-800 transition-all duration-200"
          style={{
            width: `${tabWidth}%`,
            left: `${activeIndex * tabWidth}%`,
          }}
        />
      </div>
    </div>
  );
}
