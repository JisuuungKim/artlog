import { CardList, type CardListItemData } from '@/components/cardList';
import { MiniTabs, type MiniTabItem } from '@/components/tabs';
import { useState } from 'react';

const growthDataEmpty: CardListItemData[] = [
  {
    id: '1',
    title: '지난 시간과 비교가 불가능해요!',
    content: '레슨 노트가 쌓이면 성장 과정을 확인할 수 있어요.',
  },
];

const growthData: CardListItemData[] = [];

const miniTabs: MiniTabItem[] = [
  { id: 'feedback', label: '핵심 피드백' },
  { id: 'guide', label: '연습 가이드' },
];

const feedbackSummary: CardListItemData[] = [
  {
    id: '1',
    title: '노래 시작 전 자연스럽게 호흡',
    content:
      '노래 시작 전 과하게 숨을 들이마셔 흐름을 끊지 말고 자연스럽게 시작하기.',
  },
  {
    id: '2',
    title: '입술로 딕션 명확하게 만들기',
    content: '딕션을 입술로 명확하게 응축하여 소리가 밖으로 퍼지지 않게 잡기.',
  },
  {
    id: '3',
    title: '목소리의 공명과 울림',
    content: '목소리가 머리에서 울리는 느낌을 유지하여 공명과 울림을 살리기.',
  },
];

const guideSummary: CardListItemData[] = [
  {
    id: '1',
    title: '호흡과 발성 연습',
    content: '노래 시작 전 호흡과 발성 연습을 통해 자연스러운 시작을 연습하기.',
  },
  {
    id: '2',
    title: '딕션 연습',
    content:
      '딕션 연습을 통해 입술로 소리를 명확하게 응축하는 방법을 연습하기.',
  },
  {
    id: '3',
    title: '공명과 울림 살리는 발성 연습',
    content:
      '공명과 울림을 살리는 발성 연습을 통해 목소리가 머리에서 울리는 느낌을 유지하기.',
  },
];

const nextSteps: CardListItemData[] = [
  {
    id: '1',
    content: '노래 시작 전 호흡과 발성 연습을 통해 자연스러운 시작을 연습하기.',
  },
  {
    id: '2',
    content:
      '딕션 연습을 통해 입술로 소리를 명확하게 응축하는 방법을 연습하기.',
  },
  {
    id: '3',
    content:
      '공명과 울림을 살리는 발성 연습을 통해 목소리가 머리에서 울리는 느낌을 유지하기.',
  },
];

export default function Report() {
  const [activeTab, setActiveTab] = useState('feedback');

  return (
    <div className="py-10 px-5 flex flex-col gap-15">
      <div>
        <p className="text-subtitle3 mb-4">성장 리포트</p>
        <CardList
          items={growthData.length > 0 ? growthData : growthDataEmpty}
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
          <CardList items={feedbackSummary} showTitle showNumbering />
        ) : (
          <CardList items={guideSummary} showTitle showNumbering />
        )}
      </div>
      <div>
        <p className="text-subtitle3 mb-4">다음 레슨 과제</p>
        <CardList items={nextSteps} showTitle={false} />
      </div>
    </div>
  );
}
