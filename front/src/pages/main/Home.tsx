import AppBar from '@/components/appBar';
import { BottomSheet, SheetSelector } from '@/components/bottomSheet';
import Chip from '@/components/common/Chip';
import LessonNoteCard, {
  LessonNoteFailedCard,
  LessonNoteProcessingCard,
} from '@/components/lessonNoteCard';
import { useState } from 'react';
import { useCategories } from '@/hooks/useNoteBrowser';
import { useSelectedCategory } from '@/hooks/useSelectedCategory';
import {
  useRecentLessonNotes,
  useRetryLessonNoteProcessing,
} from '@/hooks/useLessonNote';

export default function Home() {
  const { data: categoriesData = [] } = useCategories();
  const [isCategoryBottomSheetOpen, setIsCategoryBottomSheetOpen] =
    useState(false);
  const { effectiveSelectedCategoryId, setSelectedCategoryId } =
    useSelectedCategory(categoriesData);
  const { data: recentNotes = [] } = useRecentLessonNotes(
    effectiveSelectedCategoryId || undefined
  );
  const retryLessonNoteProcessing = useRetryLessonNoteProcessing();
  const selectedCategoryName =
    categoriesData.find(
      category => String(category.id) === effectiveSelectedCategoryId
    )?.name ?? '보컬';

  const handleCategoryBottomSheetOpen = () => {
    setIsCategoryBottomSheetOpen(true);
  };

  const handleCategoryBottomSheetConfirm = () => {
    setIsCategoryBottomSheetOpen(false);
  };

  const handleAddCategory = () => {
    // 카테고리 추가 로직 구현
    console.log('카테고리 추가하기');
  };

  return (
    <div className="space-y-4">
      <AppBar
        variant="category-right-icons"
        title={selectedCategoryName}
        onCategoryChevronClick={handleCategoryBottomSheetOpen}
      />
      <div className="pt-9 pb-18 px-5">
        <p className="text-h2 mb-4 text-greyscale-text-title-900">최근 노트</p>
        <div className="flex flex-col gap-2">
          {recentNotes.map(note => {
            if (note.status === 'PROCESSING') {
              return (
                <LessonNoteProcessingCard
                  key={note.id}
                  title={note.title}
                  progress={70}
                  remainingMinute={3}
                />
              );
            }

            if (note.status === 'FAILED') {
              return (
                <LessonNoteFailedCard
                  key={note.id}
                  title={note.title}
                  onRetry={() => retryLessonNoteProcessing.mutate(note.id)}
                />
              );
            }

            return (
              <LessonNoteCard
                key={note.id}
                title={note.title}
                createdAt={new Date(note.createdAt).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                folderName={note.folderName ?? '전체노트'}
                songTitles={note.songTitles}
              />
            );
          })}
        </div>
        <div className="flex justify-center pt-4">
          <Chip variant="default">더보기</Chip>
        </div>
      </div>

      <BottomSheet
        isOpen={isCategoryBottomSheetOpen}
        onClose={handleCategoryBottomSheetConfirm}
        title="카테고리"
        buttonText="확인"
      >
        <SheetSelector
          options={categoriesData}
          selected={effectiveSelectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAddCategory={handleAddCategory}
          addCategoryLabel="카테고리 추가하기"
        />
      </BottomSheet>
    </div>
  );
}
