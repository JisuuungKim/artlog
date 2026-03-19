import { CardList, type CardListItemData } from '@/components/cardList';
import { MiniTabs, type MiniTabItem } from '@/components/tabs';
import { useState } from 'react';
import type { LessonCardItem } from '@/hooks/useLessonNote';

const growthDataEmpty: CardListItemData[] = [
  {
    id: '1',
    title: '지난 시간과 비교가 불가능해요!',
    content: '레슨 노트가 쌓이면 성장 과정을 확인할 수 있어요.',
  },
];

const miniTabs: MiniTabItem[] = [
  { id: 'feedback', label: '핵심 피드백' },
  { id: 'guide', label: '연습 가이드' },
];

type ReportProps = {
  keyFeedback?: LessonCardItem[];
  practiceGuide?: LessonCardItem[];
  nextAssignment?: LessonCardItem[];
};

function toCardItems(items: LessonCardItem[]): CardListItemData[] {
  return items.map((item, index) => ({
    id: String(index + 1),
    title: item.title ?? undefined,
    content: item.content,
  }));
}

export default function Report({
  keyFeedback = [],
  practiceGuide = [],
  nextAssignment = [],
}: ReportProps) {
  const [activeTab, setActiveTab] = useState('feedback');
  const feedbackSummary = toCardItems(keyFeedback);
  const guideSummary = toCardItems(practiceGuide);
  const nextSteps = toCardItems(nextAssignment);

  return (
    <div className="py-10 px-5 flex flex-col gap-15">
      <div>
        <p className="text-subtitle3 mb-4">성장 리포트</p>
        <CardList
          items={growthDataEmpty}
          showTitle
        />
      </div>
      <div>
        <div className="w-2/5 mb-4">
          <MiniTabs
            tabs={miniTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        {activeTab === 'feedback' ? (
          <CardList
            items={feedbackSummary.length > 0 ? feedbackSummary : growthDataEmpty}
            showTitle
            showNumbering
          />
        ) : (
          <CardList
            items={guideSummary.length > 0 ? guideSummary : growthDataEmpty}
            showTitle
            showNumbering
          />
        )}
      </div>
      <div>
        <p className="text-subtitle3 mb-4">다음 레슨 과제</p>
        <CardList
          items={nextSteps.length > 0 ? nextSteps : growthDataEmpty}
          showTitle={false}
        />
      </div>
    </div>
  );
}
