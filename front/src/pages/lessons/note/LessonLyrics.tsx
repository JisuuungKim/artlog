import AppBar from '@/components/appBar';
import LyricsCard from './components/LyricsCard';
import { XGreyscale800Icon } from '@/assets/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useLessonNote } from '@/hooks/useLessonNote';

export default function LessonLyrics() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data } = useLessonNote(id);
  const feedbacks = data?.lyricsFeedbacks ?? [];

  return (
    <div>
      <AppBar
        variant="icons-left-only"
        leftIcon={<XGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
      />
      <div className="p-5">
        <p className="text-h2 text-greyscale-text-title-900 mb-2">
          오늘 배운 가사
        </p>
        <p className="text-body2 text-greyscale-neutral-600">
          가사를 탭해 상세 내용을 펼치거나 접을 수 있어요.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          {feedbacks.map(item => (
            <LyricsCard
              key={item.id}
              lyrics={item.lineText ?? ''}
              feedbackTitle={item.feedbackTitle ?? ''}
              feedback={{
                problem: item.problemText ?? '',
                solve: item.solutionText ?? '',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
