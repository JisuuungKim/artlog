import {
  BackGreyscale800Icon,
  CheckGreyscale800Icon,
  EtcGreyscale800Icon,
  FolderGreyscale800Icon,
  MusicGreyscale800Icon,
  PencilGreyscale800Icon,
  TrashcanPoint600Icon,
} from '@/assets/icons';
import AppBar from '@/components/appBar';
import { BottomSheet, SheetSelector } from '@/components/bottomSheet';
import LessonNoteCard from '@/components/lessonNoteCard';
import { DialogModal, InputModal } from '@/components/modal';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NoteSelectionBottomBar from './components/NoteSelectionBottomBar';
import NoteSelectionHeader from './components/NoteSelectionHeader';
import {
  useDeleteFolder,
  useFolderNotes,
  useFolders,
  useDeleteSong,
  useRenameFolder,
  useRenameSong,
  useSongNotes,
} from '@/hooks/useNoteBrowser';
import {
  useDeleteLessonNote,
  useMoveLessonNote,
  useRenameLessonNote,
} from '@/hooks/useLessonNote';

const VALID_TYPES = ['folder', 'lessonNote', 'music'] as const;
type NoteType = (typeof VALID_TYPES)[number];

type MenuOption = {
  id: number;
  name: string;
  icon: React.ReactNode;
  textClassName: string;
  onClick: () => void;
  types: NoteType[];
};

const CHANGE_MODAL_TITLE: Record<NoteType, string> = {
  folder: '폴더 이름 변경',
  lessonNote: '레슨 노트 이름 변경',
  music: '노래 제목 변경',
};

const DELETE_MODAL_CONTENT: Record<
  NoteType,
  { title: string; content: string }
> = {
  folder: {
    title: '폴더를 삭제하시겠어요?',
    content: `폴더 안의 노트는 삭제되지 않고
'모든 노트'로 이동해요.`,
  },
  lessonNote: {
    title: '레슨 노트를 삭제하시겠어요?',
    content: '한 번 삭제한 레슨 노트는 복구할 수 없어요.',
  },
  music: {
    title: '노래를 삭제하시겠어요?',
    content: `노래를 삭제하면 이 곡을 사용한 모든 레슨 
노트에서 정보가 삭제돼요.`,
  },
};

const formatCreatedAt = (createdAt: string) =>
  new Date(createdAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });

const isNoteType = (value: string | undefined): value is NoteType =>
  VALID_TYPES.includes(value as NoteType);

export default function NoteList() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const currentType = isNoteType(type) ? type : 'folder';

  const [etcMenuOpen, setEtcMenuOpen] = useState(false);
  const [changeNameModalOpen, setChangeNameModalOpen] = useState(false);
  const [moveNoteModalOpen, setMoveNoteModalOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedEntityName, setSelectedEntityName] = useState('');
  const [selectedEntityFolderId, setSelectedEntityFolderId] = useState('');
  const [deleteNoteModalOpen, setDeleteNoteModalOpen] = useState(false);
  const [noteSelectionMode, setNoteSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [bottomSheetType, setBottomSheetType] = useState<NoteType>(currentType);

  const { data: folders = [] } = useFolders();
  const { data: folderNotes = [] } = useFolderNotes(currentType === 'folder' ? id : undefined);
  const { data: songWithNotes } = useSongNotes(currentType === 'music' ? id : undefined);

  const currentFolderId = noteSelectionMode ? id ?? '' : selectedEntityFolderId;
  const currentEntityId = id ?? '';
  const currentFolder =
    currentType === 'folder'
      ? folders.find(folder => String(folder.id) === currentEntityId)
      : null;
  const selectedFolder =
    bottomSheetType === 'folder'
      ? folders.find(folder => String(folder.id) === selectedEntityId)
      : null;
  const pageTitle =
    currentType === 'music'
      ? songWithNotes?.title ?? '노래'
      : currentFolder?.name ?? '폴더';
  const notes = currentType === 'music' ? songWithNotes?.notes ?? [] : folderNotes;
  const canRenameCurrentEntity =
    bottomSheetType !== 'folder' || !selectedFolder?.isSystem;
  const currentMoveTargetId = noteSelectionMode ? currentEntityId : selectedEntityFolderId;
  const currentFolderCategoryId =
    folders.find(folder => String(folder.id) === currentFolderId)?.categoryId ?? null;
  const folderMoveOptions =
    currentFolderCategoryId == null
      ? folders
      : folders.filter(
          folder =>
            folder.categoryId === currentFolderCategoryId &&
            String(folder.id) !== currentMoveTargetId
        );

  const selectionCount = selectedNoteIds.length;
  const selectionDeleteContent = {
    title: `${selectionCount}개의 노트를 삭제하시겠어요?`,
    content: '한 번 삭제한 레슨 노트는 복구할 수 없어요.',
  };

  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const renameSong = useRenameSong();
  const deleteSong = useDeleteSong();
  const renameLessonNote = useRenameLessonNote();
  const deleteLessonNote = useDeleteLessonNote();
  const moveLessonNote = useMoveLessonNote();

  const closeEtcMenu = () => setEtcMenuOpen(false);
  const closeChangeNameModal = () => setChangeNameModalOpen(false);
  const closeDeleteModal = () => setDeleteNoteModalOpen(false);
  const closeMoveModal = () => setMoveNoteModalOpen(false);

  const handleEtcClick = (
    entityId: string,
    entityType: NoteType,
    entityName: string,
    entityFolderId?: string
  ) => {
    setEtcMenuOpen(true);
    setBottomSheetType(entityType);
    setSelectedEntityId(entityId);
    setSelectedEntityName(entityName);
    setSelectedEntityFolderId(entityFolderId ?? '');
  };

  const handleChangeNameOpen = () => {
    if (!canRenameCurrentEntity) {
      closeEtcMenu();
      return;
    }

    closeEtcMenu();
    setChangeNameModalOpen(true);
  };

  const handleChoiceNoteOpen = () => {
    closeEtcMenu();
    setSelectedNoteIds([]);
    setNoteSelectionMode(true);
  };

  const handleSelectionModeClose = () => {
    setSelectedNoteIds([]);
    setNoteSelectionMode(false);
  };

  const handleNoteSelectionChange = (noteId: string, selected: boolean) => {
    setSelectedNoteIds(prev =>
      selected ? [...prev, noteId] : prev.filter(id => id !== noteId)
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedNoteIds.length > 0) {
      setSelectedNoteIds([]);
      return;
    }

    setSelectedNoteIds(notes.map(note => String(note.id)));
  };

  const handleDeleteNoteOpen = () => {
    closeEtcMenu();
    setDeleteNoteModalOpen(true);
  };

  const handleMoveNoteOpen = () => {
    closeEtcMenu();
    setSelectedFolderId(noteSelectionMode ? '' : selectedEntityFolderId);
    setMoveNoteModalOpen(true);
  };

  const handleChangeNameConfirm = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || !selectedEntityId) {
      closeChangeNameModal();
      return;
    }

    if (bottomSheetType === 'folder') {
      renameFolder.mutate({ folderId: Number(selectedEntityId), name: trimmed });
    } else if (bottomSheetType === 'music') {
      renameSong.mutate({ songId: Number(selectedEntityId), title: trimmed });
    } else {
      renameLessonNote.mutate({ noteId: Number(selectedEntityId), title: trimmed });
    }

    closeChangeNameModal();
  };

  const handleDeleteConfirm = async () => {
    if (noteSelectionMode) {
      if (selectedNoteIds.length === 0) {
        closeDeleteModal();
        return;
      }

      await Promise.all(
        selectedNoteIds.map(noteId => deleteLessonNote.mutateAsync(Number(noteId)))
      );
      closeDeleteModal();
      handleSelectionModeClose();
      return;
    }

    if (!selectedEntityId) {
      closeDeleteModal();
      return;
    }

    if (bottomSheetType === 'folder') {
      deleteFolder.mutate(Number(selectedEntityId), {
        onSuccess: () => navigate(-1),
      });
    } else if (bottomSheetType === 'music') {
      deleteSong.mutate(Number(selectedEntityId), {
        onSuccess: () => navigate(-1),
      });
    } else {
      deleteLessonNote.mutate(Number(selectedEntityId));
    }

    closeDeleteModal();
  };

  const handleMoveNoteConfirm = async () => {
    if (noteSelectionMode) {
      if (!selectedFolderId || selectedNoteIds.length === 0) {
        closeMoveModal();
        return;
      }

      await Promise.all(
        selectedNoteIds.map(noteId =>
          moveLessonNote.mutateAsync({
            noteId: Number(noteId),
            folderId: Number(selectedFolderId),
          })
        )
      );
      closeMoveModal();
      handleSelectionModeClose();
      return;
    }

    if (!selectedEntityId || !selectedFolderId) {
      closeMoveModal();
      return;
    }

    await moveLessonNote.mutateAsync({
      noteId: Number(selectedEntityId),
      folderId: Number(selectedFolderId),
    });
    closeMoveModal();
  };

  const menuOptions: MenuOption[] = [
    {
      id: 1,
      name: '이름 변경',
      icon: <PencilGreyscale800Icon className="h-6 w-6" />,
      textClassName: 'text-greyscale-text-title-800',
      onClick: handleChangeNameOpen,
      types: ['folder', 'lessonNote'],
    },
    {
      id: 2,
      name: '노래 제목 변경',
      icon: <PencilGreyscale800Icon className="h-6 w-6" />,
      textClassName: 'text-greyscale-text-title-800',
      onClick: handleChangeNameOpen,
      types: ['music'],
    },
    {
      id: 3,
      name: '노트 선택',
      icon: <CheckGreyscale800Icon className="h-6 w-6" />,
      textClassName: 'text-greyscale-text-title-800',
      onClick: handleChoiceNoteOpen,
      types: ['folder'],
    },
    {
      id: 4,
      name: '폴더 이동',
      icon: <FolderGreyscale800Icon className="h-6 w-6" />,
      textClassName: 'text-greyscale-text-title-800',
      onClick: handleMoveNoteOpen,
      types: ['lessonNote'],
    },
    {
      id: 5,
      name: '삭제',
      icon: <TrashcanPoint600Icon className="h-6 w-6" />,
      textClassName: 'text-point-600',
      onClick: handleDeleteNoteOpen,
      types: ['folder', 'lessonNote', 'music'],
    },
  ];

  const visibleMenuOptions = menuOptions.filter(option => {
    if (!option.types.includes(bottomSheetType)) {
      return false;
    }

    if (option.name === '이름 변경' && !canRenameCurrentEntity) {
      return false;
    }

    return true;
  });

  return (
    <div>
      {noteSelectionMode ? (
        <>
          <div className="min-h-screen bg-greyscale-bg-100 pb-[74px] pt-[10px]">
            <NoteSelectionHeader
              folderName={pageTitle}
              selectedCount={selectionCount}
              onClose={handleSelectionModeClose}
              onToggleSelectAll={handleToggleSelectAll}
            />
            <div className="space-y-2 px-5">
              {notes.map(note => (
                <LessonNoteCard
                  key={note.id}
                  title={note.title}
                  createdAt={formatCreatedAt(note.createdAt)}
                  folderName={note.folderName ?? '모든 노트'}
                  songTitles={note.songTitles}
                  editMode
                  selected={selectedNoteIds.includes(String(note.id))}
                  onSelectionChange={selected =>
                    handleNoteSelectionChange(String(note.id), selected)
                  }
                  showEtcButton={false}
                />
              ))}
            </div>
          </div>
          <NoteSelectionBottomBar
            disabled={selectionCount === 0}
            onMove={handleMoveNoteOpen}
            onDelete={handleDeleteNoteOpen}
          />
        </>
      ) : (
        <>
          <AppBar
            variant="icons-left-right-single"
            leftIcon={<BackGreyscale800Icon onClick={() => navigate(-1)} />}
            rightIcon={
              <EtcGreyscale800Icon
                onClick={() =>
                  handleEtcClick(
                    currentEntityId,
                    currentType,
                    pageTitle
                  )
                }
              />
            }
          />
          <div className="p-5">
            <div className="mb-4 flex items-center gap-1">
              {currentType === 'folder' ? (
                <FolderGreyscale800Icon className="h-6 w-6" />
              ) : (
                <MusicGreyscale800Icon className="h-6 w-6" />
              )}
              <span className="text-h2 text-greyscale-text-title-900">
                {pageTitle}
              </span>
            </div>
            <div>
              {notes.map(note => (
                <LessonNoteCard
                  key={note.id}
                  title={note.title}
                  createdAt={formatCreatedAt(note.createdAt)}
                  folderName={note.folderName ?? '모든 노트'}
                  songTitles={note.songTitles}
                  onEtcClick={() =>
                    handleEtcClick(
                      String(note.id),
                      'lessonNote',
                      note.title,
                      String(note.folderId ?? '')
                    )
                  }
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ETC 바텀시트 */}
      <BottomSheet
        isOpen={etcMenuOpen}
        onClose={closeEtcMenu}
        showButton={false}
        showHeader={false}
      >
        <div className="space-y-2 pb-5">
          {visibleMenuOptions.map(option => (
            <div
              key={option.id}
              className="py-2 flex items-center gap-2.5"
              onClick={option.onClick}
            >
              {option.icon}
              <span className={`text-subtitle2 ${option.textClassName}`}>
                {option.name}
              </span>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* 변경 관련 모달 */}
      <InputModal
        isOpen={changeNameModalOpen}
        onClose={closeChangeNameModal}
        title={CHANGE_MODAL_TITLE[bottomSheetType]}
        defaultValue={selectedEntityName}
        onConfirm={handleChangeNameConfirm}
        maxLength={bottomSheetType === 'music' ? 28 : undefined}
      />

      {/* 삭제 관련 모달 */}
      <DialogModal
        type="two-buttons"
        isOpen={deleteNoteModalOpen}
        onClose={closeDeleteModal}
        title={
          noteSelectionMode
            ? selectionDeleteContent.title
            : DELETE_MODAL_CONTENT[bottomSheetType].title
        }
        content={
          noteSelectionMode
            ? selectionDeleteContent.content
            : DELETE_MODAL_CONTENT[bottomSheetType].content
        }
        primaryButtonText="삭제"
        secondaryButtonText="취소"
        onPrimaryClick={handleDeleteConfirm}
        onSecondaryClick={closeDeleteModal}
      />

      {/* 폴더 이동 관련 바텀시트 */}
      <BottomSheet
        isOpen={moveNoteModalOpen}
        onClose={closeMoveModal}
        title="폴더 이동"
        buttonText="확인"
        onButtonClick={handleMoveNoteConfirm}
        showHandle={false}
      >
        <SheetSelector
          options={folderMoveOptions}
          selected={selectedFolderId}
          onSelect={setSelectedFolderId}
          currentId={currentMoveTargetId}
        />
      </BottomSheet>
    </div>
  );
}
