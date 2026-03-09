import AppBar from '@/components/appBar';
import { ListItem } from '@/components/listItem';
import { SectionHeader } from '@/pages/main/components/sectionHeader';
import { FolderGreyscale800Icon } from '@/assets/icons';
import SongSelector from '../lessons/new/components/SongSelector';
import { BottomSheet, SheetSelector } from '@/components/bottomSheet';
import type { SheetOption } from '@/components/bottomSheet';
import { useState } from 'react';
import { InputModal } from '@/components/modal';

const categories: SheetOption[] = [
  { id: '1', name: '보컬' },
  { id: '2', name: '피아노' },
  { id: '3', name: '연기' },
];

const songs: SheetOption[] = [
  { id: '1', name: '누가 울새를 죽였니' },
  { id: '2', name: '작은 별' },
  { id: '3', name: '생일' },
  { id: '4', name: 'New life' },
  { id: '5', name: '나를 지킨다는 것' },
  { id: '6', name: '사랑이란' },
];

export default function Folder() {
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [open, setOpen] = useState({ folder: true, music: true });
  const [addFolderModalOpen, setAddFolderModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const [isCategoryBottomSheetOpen, setIsCategoryBottomSheetOpen] = useState(false);

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const toggle = (key: 'folder' | 'music') =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAddFolder = () => {
    setAddFolderModalOpen(true);
  };

  const handleConfirm = (_value: string) => {
    setAddFolderModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <AppBar
        variant="category-title-only"
        title={categoryMap.get(selectedCategoryId) || '보컬'}
        onCategoryChevronClick={() => setIsCategoryBottomSheetOpen(true)}
      />
      <div className="py-5 flex flex-col gap-8">
        <div className="px-5">
          <SectionHeader
            title="폴더"
            isPlusIcon
            isOpen={open.folder}
            onArrowClick={() => toggle('folder')}
            onPlusClick={handleAddFolder}
          />
          <div
            className={`grid transition-all duration-300 ${
              open.folder ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <ListItem
                label="폴더1"
                icon={<FolderGreyscale800Icon />}
                count={20}
              />
              <ListItem
                label="폴더1"
                icon={<FolderGreyscale800Icon />}
                count={20}
              />
              <ListItem
                label="폴더1"
                icon={<FolderGreyscale800Icon />}
                count={20}
              />
            </div>
          </div>
        </div>
        <div className="px-5">
          <SectionHeader
            title="음악"
            isOpen={open.music}
            onArrowClick={() => toggle('music')}
          />
          <div
            className={`grid transition-all duration-300 ${
              open.music ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <SongSelector
                songs={songs}
                showAllSongs={showAllSongs}
                setShowAllSongs={setShowAllSongs}
              />
            </div>
          </div>
        </div>
      </div>
      <InputModal
        isOpen={addFolderModalOpen}
        onClose={() => setAddFolderModalOpen(false)}
        title="새 폴더 만들기"
        placeholder="새로운 폴더"
        cancelText="취소"
        confirmText="확인"
        onConfirm={handleConfirm}
      />
      <BottomSheet
        isOpen={isCategoryBottomSheetOpen}
        onClose={() => setIsCategoryBottomSheetOpen(false)}
        title="카테고리"
        buttonText="확인"
      >
        <SheetSelector
          options={categories}
          selected={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAddCategory={() => console.log('카테고리 추가하기')}
          addCategoryLabel="카테고리 추가하기"
        />
      </BottomSheet>
    </div>
  );
}
