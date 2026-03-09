import React, { useState } from 'react';
import MiniTabs from './MiniTabs';
import type { MiniTabItem } from './MiniTabs.types';

const MiniTabsExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('feedback');

  const tabs: MiniTabItem[] = [
    { id: 'feedback', label: '핵심 피드백' },
    { id: 'guide', label: '연습 가이드' },
  ];

  return (
    <div className="p-5 space-y-6 bg-greyscale-bg-100 min-h-screen">
      <div>
        <h2 className="text-h3 mb-4">MiniTabs 예시</h2>
        <MiniTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-4 bg-white rounded-lg">
        {activeTab === 'feedback' && (
          <div>
            <h3 className="text-subtitle2 mb-2">핵심 피드백</h3>
            <p className="text-body text-greyscale-neutral-600">
              오늘 레슨에서 개선된 점들과 앞으로 집중해야 할 부분에 대한 핵심
              피드백입니다.
            </p>
          </div>
        )}

        {activeTab === 'guide' && (
          <div>
            <h3 className="text-subtitle2 mb-2">연습 가이드</h3>
            <p className="text-body text-greyscale-neutral-600">
              집에서 연습할 때 참고할 수 있는 구체적인 연습 방법과 가이드입니다.
            </p>
          </div>
        )}
      </div>

      {/* 추가 예시 */}
      <div>
        <h2 className="text-h3 mb-4">다른 탭 구성 예시</h2>
        <MiniTabs
          tabs={[
            { id: 'tab1', label: '기본 정보' },
            { id: 'tab2', label: '상세 내용' },
            { id: 'tab3', label: '추가 설정' },
          ]}
          activeTab="tab1"
          onTabChange={() => {}}
        />
      </div>
    </div>
  );
};

export default MiniTabsExample;
