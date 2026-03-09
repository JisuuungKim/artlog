import { useState } from 'react';
import Chip from '@/components/common/Chip';
import { CardList } from '@/components/cardList';

// todo: 여기 잘 생각해서 데이터 구조를 짜자

const feedbackItems = {
  발성: [
    {
      id: '1',
      title: '고음에서 아래를 잡고 위로 올리기',
      content:
        '음이 높아질수록 중심이 위로 뜨기 쉬움. 이때 아래(코어, 하체)를 더 강하게 잡으면서 위로 소리를 쏘아 올려야 단단한 소리가 남.',
    },
    {
      id: '2',
      title: '호흡과 발성의 타이밍',
      content:
        '노래 시작 전 과하게 숨을 들이마셔 흐름을 끊지 말고 자연스럽게 시작하기.',
    },
  ],
  발음: [
    {
      id: '1',
      title: '딕션을 입술로 명확하게 응축하기',
      content:
        '딕션을 입술로 명확하게 응축하여 소리가 밖으로 퍼지지 않게 잡기.',
    },
  ],
  '음정 · 박자': [],
  '감정 · 해석': [
    {
      id: '1',
      title: '노래의 감정과 해석',
      content: '노래의 가사와 멜로디에 담긴 감정을 깊이 이해하고 표현하기.',
    },
    {
      id: '2',
      title: '감정 표현의 다양성',
      content:
        '노래의 각 부분에서 다양한 감정을 표현하여 곡 전체에 풍부한 해석을 더하기.',
    },
  ],
};

export default function Feedback() {
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');

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
