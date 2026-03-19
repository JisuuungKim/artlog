import { useState } from 'react';
import Chip from '@/components/common/Chip';
import { CardList } from '@/components/cardList';
import type { LessonFeedbackGroup } from '@/hooks/useLessonNote';

type FeedbackProps = {
  feedbackGroups?: LessonFeedbackGroup[];
};

export default function Feedback({ feedbackGroups = [] }: FeedbackProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');
  const feedbackItems = Object.fromEntries(
    feedbackGroups.map(group => [
      group.keyword,
      group.cards.map(card => ({
        id: String(card.id),
        title: card.title,
        content: card.content,
      })),
    ])
  );

  return (
    <div className="flex flex-col">
      {/* 필터 칩들 */}
      <div className="pt-5 pl-5">
        <div className="flex gap-2 flex-no-wrap text-caption1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style]:none [scrollbar-width]:none">
          <Chip
            variant={selectedFilter === '전체' ? 'selected' : 'default'}
            showNumber={true}
            number={Object.values(feedbackItems).reduce(
              (acc, items) => acc + items.length,
              0
            )}
            onClick={() => setSelectedFilter('전체')}
          >
            전체
          </Chip>
          {Object.entries(feedbackItems).map(([keyword, items]) => (
            <Chip
              key={keyword}
              variant={selectedFilter === keyword ? 'selected' : 'default'}
              showNumber={true}
              number={items.length}
              onClick={() => setSelectedFilter(keyword)}
            >
              {keyword}
            </Chip>
          ))}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 px-5 pt-10">
        {selectedFilter === '전체'
          ? Object.entries(feedbackItems).map(
              ([keyword, items]) =>
                items.length > 0 && (
                  <div key={keyword} className="mb-8">
                    <div className="text-subtitle3 flex gap-1 items-center mb-4">
                      <p className="text-greyscale-text-title-900">{keyword}</p>
                      <span className="text-primary-500">{items.length}</span>
                    </div>
                    <CardList items={items} showTitle />
                  </div>
                )
            )
          : feedbackItems[selectedFilter as keyof typeof feedbackItems]
              ?.length > 0 && (
              <div className="mb-8">
                <div className="text-subtitle3 flex gap-1 items-center mb-4">
                  <p className="text-greyscale-text-title-900">
                    {selectedFilter}
                  </p>
                  <span className="text-primary-500">
                    {
                      feedbackItems[
                        selectedFilter as keyof typeof feedbackItems
                      ]?.length
                    }
                  </span>
                </div>
                <CardList
                  items={
                    feedbackItems[selectedFilter as keyof typeof feedbackItems]
                  }
                  showTitle
                />
              </div>
            )}
        {/* todo: 해당 키워드 피드백이 없을 경우에 대한 컴포넌트 */}
      </div>
    </div>
  );
}
