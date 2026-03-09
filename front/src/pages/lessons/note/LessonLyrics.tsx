import AppBar from '@/components/appBar';
import LyricsCard from './components/LyricsCard';
import { XGreyscale800Icon } from '@/assets/icons';

export default function LessonLyrics() {
  const feedback = {
    problem: '시작할 때 숨을 들이마시며 소리를 띄우려 함.',
    solve:
      '숨을 마시는 지점부터 시작하지 말고, 가고자 하는 방향으로 바로 소리를 시작. 호흡이 아닌 기운으로 공기를 먼저 만들어야 함.',
  };
  return (
    <div>
      <AppBar variant="icons-left-only" leftIcon={<XGreyscale800Icon />} />
      <div className="p-5">
        <p className="text-h2 text-greyscale-text-title-900 mb-2">
          오늘 배운 가사
        </p>
        <p className="text-body2 text-greyscale-neutral-600">
          가사를 탭해 상세 내용을 펼치거나 접을 수 있어요.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          {/* todo: 애니메이션 어떻게 하면 좋을지 물어보기 */}
          <LyricsCard
            lyrics="지금 이 순간 지금 여기"
            feedbackTitle="호흡이 아닌 기운으로 공기를 만들기"
            feedback={feedback}
          />
          <LyricsCard
            lyrics="지금 이 순간 지금 여기"
            feedbackTitle="호흡이 아닌 기운으로 공기를 만들기"
            feedback={feedback}
          />
          <LyricsCard
            lyrics="지금 이 순간 지금 여기"
            feedbackTitle="호흡이 아닌 기운으로 공기를 만들기"
            feedback={feedback}
          />
        </div>
      </div>
    </div>
  );
}
