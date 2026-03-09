import { useState } from 'react';
import { MiniTag } from '@/components/miniTag';
import { MusicGreyscale800Icon, MusicPrimary600Icon } from '@/assets/icons';

type FeedbackItem = {
  problem: string;
  solve: string;
};

type LyricsCardProps = {
  lyrics: string;
  feedbackTitle: string;
  feedback: FeedbackItem;
  defaultOpen?: boolean;
};

export default function LyricsCard({
  lyrics,
  feedbackTitle,
  feedback,
  defaultOpen = false,
}: LyricsCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col rounded-2xl shadow-[0px_0px_8px_0px_rgba(0,0,0,0.04)] w-full">
      {/* 가사 카드 헤더 (tab=false/true 토글) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex flex-col items-start px-4 py-1.5 w-full text-left transition-colors duration-300 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.05)] ${
          isOpen
            ? 'border border-solid border-primary-400 bg-primary-50 rounded-t-2xl'
            : 'rounded-2xl bg-greyscale-bg-50'
        }`}
      >
        <div className="flex flex-col overflow-hidden py-2 w-full">
          <div className="flex gap-2.5 items-center w-full">
            <span className="transition-opacity duration-200 shrink-0">
              {isOpen ? <MusicPrimary600Icon /> : <MusicGreyscale800Icon />}
            </span>
            {/* 가사 텍스트 */}
            <p
              className={`flex-1 text-subtitle3 text-ellipsis overflow-hidden whitespace-nowrap transition-colors duration-300 ${isOpen ? 'text-primary-600' : 'text-greyscale-text-title-800'}`}
            >
              {lyrics}
            </p>
          </div>
        </div>
      </button>

      {/* 피드백 내용 슬라이드 애니메이션 (grid-template-rows 트릭) */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 items-start pb-6 pt-5 px-6 w-full rounded-b-2xl border border-t-0 border-solid border-primary-400 bg-greyscale-bg-50">
            {/* 피드백 제목 */}
            <p className="text-subtitle3 text-greyscale-text-title-800 w-full whitespace-pre-wrap">
              {feedbackTitle}
            </p>

            {/* Problem & Solve */}
            <div className="flex flex-col gap-3 items-start w-full">
              {/* 문제 */}
              <div className="flex gap-2 items-start w-full">
                <MiniTag variant="error">문제</MiniTag>
                <p className="flex-1 text-body2 text-greyscale-text-body-700 whitespace-pre-wrap">
                  {feedback.problem}
                </p>
              </div>

              {/* 해결 */}
              <div className="flex gap-2 items-start w-full">
                <MiniTag variant="outline">해결</MiniTag>
                <p className="flex-1 text-body2 text-greyscale-text-body-700 whitespace-pre-wrap">
                  {feedback.solve}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
