import {
  ArrowDownGreyscale800Icon,
  ArrowRightGreyscale500Icon,
} from '@/assets/icons';
import { useState } from 'react';
import MiniTag from '@/components/miniTag';
import Chip from '@/components/common/Chip';
import Tabs from '@/components/tabs';
import Report from './components/Report';
import Feedback from './components/Feedback';

// 레슨곡 배열
const lessonSongs = ['누가 죄인인가', '작은 별', '생일 축하합니다'];

// tab 데이터
const tabs = [
  { id: 'report', label: '리포트' },
  { id: 'feedback', label: '피드백' },
];

export default function LessonDetail() {
  // const { id } = useParams<{ id: string }>();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSongs = () => {
    setShowAllSongs(!showAllSongs);
  };

  return (
    <>
      <div>
        <div className="flex flex-col gap-6 p-5 pt-3 pb-7">
          {/* Top Section */}
          <div className="flex flex-col gap-2">
            {/* Category MiniTag */}
            <div>
              <MiniTag fill={false}>보컬</MiniTag>
            </div>

            {/* Title and Date */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-subtitle1 text-greyscale-text-title-900 truncate max-w-[288px]">
                  2026.01.20. 레슨노트
                </h1>
                <div className="flex items-center gap-0.5 text-caption1 text-greyscale-neutral-600">
                  <span>2025. 01. 01. (월) 오후 5:00</span>
                  <span>·</span>
                  <span>1시간</span>
                </div>
              </div>
              <button
                onClick={toggleExpanded}
                className="transition-transform duration-200"
              >
                <ArrowDownGreyscale800Icon
                  className={`w-6 h-6 text-greyscale-text-disabled-500 transition-transform duration-200 ${
                    isExpanded ? '' : 'rotate-180'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Bottom Section */}
          {isExpanded && (
            <div className="flex flex-col gap-4">
              {/* Folder Section */}
              <div className="grid grid-cols-[64px_1fr] gap-3">
                <div className="flex flex-col">
                  <div className="h-1.5" />
                  <div className="flex items-center gap-0.5">
                    <p className="text-label text-greyscale-text-disabled-500 truncate max-w-[48px]">
                      폴더
                    </p>
                    <ArrowRightGreyscale500Icon className="w-4 h-4 text-greyscale-text-disabled-500" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="filter">모든 노트</Chip>
                </div>
              </div>

              {/* Lesson Songs Section */}
              <div className="grid grid-cols-[64px_1fr] gap-3">
                <div className="flex flex-col">
                  <div className="h-1.5" />
                  <div className="flex items-center gap-0.5">
                    <p className="text-label text-greyscale-text-disabled-500 truncate max-w-[48px]">
                      레슨 곡
                    </p>
                    <ArrowRightGreyscale500Icon className="w-4 h-4 text-greyscale-text-disabled-500" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* 레슨곡이 2개 이상이고 전체 표시가 false인 경우 첫 번째만 표시 */}
                  {lessonSongs.length >= 2 && !showAllSongs ? (
                    <>
                      <Chip variant="filter">{lessonSongs[0]}</Chip>
                      <Chip variant="default" onClick={toggleSongs}>
                        +{lessonSongs.length - 1}
                      </Chip>
                    </>
                  ) : (
                    <>
                      {lessonSongs.map((song, index) => (
                        <Chip key={index} variant="filter">
                          {song}
                        </Chip>
                      ))}
                      {/* 2개 이상이면서 전체 표시 중일 때 접기 버튼 */}
                      {lessonSongs.length >= 2 && showAllSongs && (
                        <Chip variant="default" onClick={toggleSongs}>
                          접기
                        </Chip>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Condition Section */}
              <div className="grid grid-cols-[64px_1fr] gap-3">
                <div className="flex flex-col">
                  <div className="h-1.5" />
                  <div className="flex items-center gap-0.5">
                    <p className="text-label text-greyscale-text-disabled-500 truncate max-w-[48px]">
                      컨디션
                    </p>
                    <ArrowRightGreyscale500Icon className="w-4 h-4 text-greyscale-text-disabled-500" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="default">
                    컨디션은 좋았지만 목이 까끌거리고 아픔
                  </Chip>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 메인 탭 */}
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 탭 컨텐츠 */}
        {activeTab === 'report' && <Report />}
        {activeTab === 'feedback' && <Feedback />}
      </div>
    </>
  );
}
