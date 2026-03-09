import AppBar from '@/components/appBar';
import { BottomSheet, SheetSelector } from '@/components/bottomSheet';
import type { SheetOption } from '@/components/bottomSheet';
import Chip from '@/components/common/Chip';
import LessonNoteCard, {
  LessonNoteFailedCard,
  LessonNoteProcessingCard,
} from '@/components/lessonNoteCard';
import { useState } from 'react';

const categories: SheetOption[] = [
  { id: '1', name: '보컬' },
  { id: '2', name: '피아노' },
  { id: '3', name: '연기' },
];

export default function Home() {
  const [selected, setSelected] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const [isCategoryBottomSheetOpen, setIsCategoryBottomSheetOpen] =
    useState(false);

  const categoryMap = new Map(
    categories.map(category => [category.id, category.name])
  );

  const onSelectionChange = (isSelected: boolean) => {
    setSelected(isSelected);
  };

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
        title={categoryMap.get(selectedCategoryId) || '보컬'}
        onCategoryChevronClick={handleCategoryBottomSheetOpen}
      />
      <div className="pt-9 pb-18 px-5">
        <p className="text-h2 mb-4 text-greyscale-text-title-900">최근 노트</p>
        <div className="flex flex-col gap-2">
          <LessonNoteProcessingCard progress={70} remainingMinute={3} />
          <LessonNoteFailedCard />
          <LessonNoteCard
            editMode
            selected={selected}
            onSelectionChange={onSelectionChange}
          />
          <LessonNoteCard />
          <LessonNoteCard isNew />
          <LessonNoteCard isNew />
          <LessonNoteCard isNew />
          <LessonNoteCard isNew />
          <LessonNoteCard isNew />
          <LessonNoteCard isNew />
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
          options={categories}
          selected={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAddCategory={handleAddCategory}
          addCategoryLabel="카테고리 추가하기"
        />
      </BottomSheet>
    </div>
  );
}
