import AppBar from '@/components/appBar';
import { ListItem } from '@/components/listItem';
import { SectionHeader } from '@/pages/main/components/sectionHeader';
import { FolderGreyscale800Icon } from '@/assets/icons';
import SongSelector from '../lessons/new/components/SongSelector';
import {
  AddDirectlyContent,
  BottomSheet,
  SheetSelector,
} from '@/components/bottomSheet';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputModal } from '@/components/modal';
import {
  useCategories,
  useCreateFolder,
  useFolders,
  useRegisterUserInterestCategory,
  useSongs,
} from '@/hooks/useNoteBrowser';
import { useSelectedCategory } from '@/hooks/useSelectedCategory';
import { useTextInput } from '@/components/textInput';

type CategoryBottomSheetMode = 'select' | 'create';

export default function Folder() {
  const navigate = useNavigate();
  const { data: categoriesData = [] } = useCategories();
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [open, setOpen] = useState({ folder: true, music: true });
  const [addFolderModalOpen, setAddFolderModalOpen] = useState(false);
  const [isCategoryBottomSheetOpen, setIsCategoryBottomSheetOpen] =
    useState(false);
  const [categoryBottomSheetMode, setCategoryBottomSheetMode] =
    useState<CategoryBottomSheetMode>('select');
  const { effectiveSelectedCategoryId, setSelectedCategoryId } =
    useSelectedCategory(categoriesData);
  const { data: foldersData = [] } = useFolders(
    effectiveSelectedCategoryId || undefined
  );
  const { data: songsData = [] } = useSongs(
    effectiveSelectedCategoryId || undefined
  );
  const createFolder = useCreateFolder();
  const registerUserInterestCategory = useRegisterUserInterestCategory();
  const categoryInput = useTextInput('');
  const selectedCategoryName =
    categoriesData.find(
      category => String(category.id) === effectiveSelectedCategoryId
    )?.name ?? '관심 카테고리 없음';

  const toggle = (key: 'folder' | 'music') =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAddFolder = () => {
    setAddFolderModalOpen(true);
  };

  const handleConfirm = (value: string) => {
    if (value.trim() && effectiveSelectedCategoryId) {
      createFolder.mutate({
        name: value,
        categoryId: Number(effectiveSelectedCategoryId),
      });
    }
    setAddFolderModalOpen(false);
  };

  const handleCategoryBottomSheetOpen = () => {
    setCategoryBottomSheetMode('select');
    setIsCategoryBottomSheetOpen(true);
  };

  const handleCategoryBottomSheetClose = () => {
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
          handleCategoryBottomSheetClose();
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <AppBar
        variant="category-title-only"
        title={selectedCategoryName}
        onCategoryChevronClick={handleCategoryBottomSheetOpen}
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
              {foldersData.map(folder => (
                <ListItem
                  key={folder.id}
                  label={folder.name}
                  icon={<FolderGreyscale800Icon />}
                  count={folder.noteCount}
                  onClick={() => navigate(`/notes/folder/${folder.id}`)}
                />
              ))}
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
                songs={songsData}
                showAllSongs={showAllSongs}
                setShowAllSongs={setShowAllSongs}
                handleSongButtonClick={songId => navigate(`/notes/music/${songId}`)}
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
        onClose={handleCategoryBottomSheetClose}
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
