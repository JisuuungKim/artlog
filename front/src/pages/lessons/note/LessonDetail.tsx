import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Tabs from '@/components/tabs';
import Report from './components/Report';
import Feedback from './components/Feedback';
import LessonProcessingContent from './components/LessonProcessingContent';
import LessonTitleCard from './components/LessonTitleCard';
import { useDeleteLessonNote, useLessonNote } from '@/hooks/useLessonNote';
import AppBar from '@/components/appBar';
import { BackGreyscale800Icon } from '@/assets/icons';

// tab 데이터
const tabs = [
  { id: 'report', label: '리포트' },
  { id: 'feedback', label: '피드백' },
];

export default function LessonDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data } = useLessonNote(id);
  const deleteLessonNote = useDeleteLessonNote();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const isProcessing = data?.status === 'PROCESSING';
  const lessonSongs = data?.songTitles ?? [];
  const formattedDate = data?.createdAt
    ? new Date(data.createdAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '2025. 01. 01. (월) 오후 5:00';

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSongs = () => {
    setShowAllSongs(!showAllSongs);
  };

  const handleCancelProcessing = () => {
    if (!id) {
      return;
    }

    deleteLessonNote.mutate(Number(id), {
      onSuccess: () => {
        navigate('/');
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar
        variant="icons-left-only"
        leftIcon={<BackGreyscale800Icon />}
        leftIconClick={() => navigate(-1)}
      />
      <LessonTitleCard
        title={data?.title ?? '2026.01.20. 레슨노트'}
        formattedDate={formattedDate}
        categoryLabel={data?.categoryName ?? '카테고리 없음'}
        folderName={data?.folderName ?? '모든 노트'}
        lessonSongs={lessonSongs}
        conditionText={
          data?.conditionText ?? '컨디션은 좋았지만 목이 까끌거리고 아픔'
        }
        isExpanded={isExpanded}
        showAllSongs={showAllSongs}
        onToggleExpanded={toggleExpanded}
        onToggleSongs={toggleSongs}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {isProcessing ? (
        <LessonProcessingContent
          progress={data?.processingProgress}
          message={data?.processingMessage}
          onCancel={handleCancelProcessing}
          isCancelling={deleteLessonNote.isPending}
        />
      ) : (
        <>
          {activeTab === 'report' && (
            <Report
              keyFeedback={data?.keyFeedback}
              practiceGuide={data?.practiceGuide}
              nextAssignment={data?.nextAssignment}
            />
          )}
          {activeTab === 'feedback' && (
            <Feedback feedbackGroups={data?.feedbackGroups} />
          )}
        </>
      )}
    </div>
  );
}
