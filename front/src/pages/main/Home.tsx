import AppBar from '@/components/appBar';
import {
  AddDirectlyContent,
  BottomSheet,
  SheetSelector,
} from '@/components/bottomSheet';
import Chip from '@/components/common/Chip';
import LessonNoteCard, {
  LessonNoteFailedCard,
  LessonNoteProcessingCard,
} from '@/components/lessonNoteCard';
import { useState } from 'react';
import { useTextInput } from '@/components/textInput';
import {
  useCategories,
  useRegisterUserInterestCategory,
} from '@/hooks/useNoteBrowser';
import { useSelectedCategory } from '@/hooks/useSelectedCategory';
import {
  useRecentLessonNotes,
  useRetryLessonNoteProcessing,
} from '@/hooks/useLessonNote';
import { useNavigate } from 'react-router-dom';

type CategoryBottomSheetMode = 'select' | 'create';

export default function Home() {
  const navigate = useNavigate();
  const { data: categoriesData = [] } = useCategories();
  const [isCategoryBottomSheetOpen, setIsCategoryBottomSheetOpen] =
    useState(false);
  const [categoryBottomSheetMode, setCategoryBottomSheetMode] =
    useState<CategoryBottomSheetMode>('select');
  const { effectiveSelectedCategoryId, setSelectedCategoryId } =
    useSelectedCategory(categoriesData);
  const { data: recentNotes = [] } = useRecentLessonNotes(
    effectiveSelectedCategoryId || undefined
  );
  const retryLessonNoteProcessing = useRetryLessonNoteProcessing();
  const registerUserInterestCategory = useRegisterUserInterestCategory();
  const categoryInput = useTextInput('');
  const selectedCategoryName =
    categoriesData.find(
      category => String(category.id) === effectiveSelectedCategoryId
    )?.name ?? '관심 카테고리 없음';

  const handleCategoryBottomSheetOpen = () => {
    setCategoryBottomSheetMode('select');
    setIsCategoryBottomSheetOpen(true);
  };

  const handleCategoryBottomSheetConfirm = () => {
    setCategoryBottomSheetMode('select');
    categoryInput.onClear();
    setIsCategoryBottomSheetOpen(false);
  };

  const handleAddCategory = () => {
    setCategoryBottomSheetMode('create');
  };

  const handleAddCategorySubmit = () => {
    const name = categoryInput.value.trim();
    if (!name || registerUserInterestCategory.isPending) {
      return;
    }

    registerUserInterestCategory.mutate(
      { name },
      {
        onSuccess: category => {
          setSelectedCategoryId(String(category.id));
          handleCategoryBottomSheetConfirm();
        },
      }
    );
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
                onClick={() => navigate(`/lessons/${note.id}`)}
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
        title={
          categoryBottomSheetMode === 'create'
            ? '카테고리 직접 추가하기'
            : '카테고리'
        }
        buttonText="확인"
        showButton={categoryBottomSheetMode === 'select'}
      >
        {categoryBottomSheetMode === 'select' ? (
          <SheetSelector
            options={categoriesData}
            selected={effectiveSelectedCategoryId}
            onSelect={setSelectedCategoryId}
            onAddCategory={handleAddCategory}
            addCategoryLabel="카테고리 추가하기"
          />
        ) : (
          <AddDirectlyContent
            inputProps={{
              isTyping: categoryInput.isTyping,
              isFocused: categoryInput.isFocused,
              value: categoryInput.value,
              onChange: categoryInput.onChange,
              onFocus: categoryInput.onFocus,
              onBlur: categoryInput.onBlur,
              onClear: categoryInput.onClear,
            }}
            onAdd={handleAddCategorySubmit}
            placeholder="카테고리 이름을 입력해주세요"
            maxLength={20}
          />
        )}
      </BottomSheet>
    </div>
  );
}
