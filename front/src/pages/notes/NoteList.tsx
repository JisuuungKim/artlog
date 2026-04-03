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

export default function NoteList() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const VALID_TYPES = ['folder', 'lessonNote', 'music'] as const;
  type NoteType = (typeof VALID_TYPES)[number];
  const isNoteType = (v: string | undefined): v is NoteType =>
    VALID_TYPES.includes(v as NoteType);

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
  const [bottomSheetType, setBottomSheetType] = useState<NoteType>(
    isNoteType(type) ? type : 'folder'
  );
  const { data: folders = [] } = useFolders();
  const { data: folderNotes = [] } = useFolderNotes(
    type === 'folder' ? id : undefined
  );
  const { data: songWithNotes } = useSongNotes(type === 'music' ? id : undefined);
  const title =
    type === 'music'
      ? songWithNotes?.title ?? '노래'
      : folders.find(folder => String(folder.id) === id)?.name ?? '폴더';
  const notes = type === 'music' ? songWithNotes?.notes ?? [] : folderNotes;
  const currentFolderCategoryId =
    folders.find(folder => String(folder.id) === (noteSelectionMode ? id : selectedEntityFolderId))
      ?.categoryId ??
    null;
  const folderMoveOptions =
    currentFolderCategoryId == null
      ? folders
      : folders.filter(
          folder =>
            folder.categoryId === currentFolderCategoryId &&
            String(folder.id) !== (noteSelectionMode ? id : selectedEntityFolderId)
        );
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const renameSong = useRenameSong();
  const deleteSong = useDeleteSong();
  const renameLessonNote = useRenameLessonNote();
  const deleteLessonNote = useDeleteLessonNote();
  const moveLessonNote = useMoveLessonNote();

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
    setEtcMenuOpen(false);
    setChangeNameModalOpen(true);
  };

  const handleChoiceNoteOpen = () => {
    setEtcMenuOpen(false);
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
    setEtcMenuOpen(false);
    setDeleteNoteModalOpen(true);
  };

  const handleMoveNoteOpen = () => {
    setEtcMenuOpen(false);
    setSelectedFolderId(noteSelectionMode ? '' : selectedEntityFolderId);
    setMoveNoteModalOpen(true);
  };

  const handleChangeNameConfirm = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || !selectedEntityId) {
      setChangeNameModalOpen(false);
      return;
    }

    if (bottomSheetType === 'folder') {
      renameFolder.mutate({ folderId: Number(selectedEntityId), name: trimmed });
    } else if (bottomSheetType === 'music') {
      renameSong.mutate({ songId: Number(selectedEntityId), title: trimmed });
    } else {
      renameLessonNote.mutate({ noteId: Number(selectedEntityId), title: trimmed });
    }

    setChangeNameModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (noteSelectionMode) {
      if (selectedNoteIds.length === 0) {
        setDeleteNoteModalOpen(false);
        return;
      }

      await Promise.all(
        selectedNoteIds.map(noteId => deleteLessonNote.mutateAsync(Number(noteId)))
      );
      setDeleteNoteModalOpen(false);
      handleSelectionModeClose();
      return;
    }

    if (!selectedEntityId) {
      setDeleteNoteModalOpen(false);
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

    setDeleteNoteModalOpen(false);
  };

  const handleMoveNoteConfirm = async () => {
    if (noteSelectionMode) {
      if (!selectedFolderId || selectedNoteIds.length === 0) {
        setMoveNoteModalOpen(false);
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
      setMoveNoteModalOpen(false);
      handleSelectionModeClose();
      return;
    }

    if (!selectedEntityId || !selectedFolderId) {
      setMoveNoteModalOpen(false);
      return;
    }

    await moveLessonNote.mutateAsync({
      noteId: Number(selectedEntityId),
      folderId: Number(selectedFolderId),
    });
    setMoveNoteModalOpen(false);
  };

  // todo: 전체 노트는 이름 변경 안되게
  const folderBottomSheetOptions = [
    {
      id: 1,
      name: '이름 변경',
      icon: <PencilGreyscale800Icon className="h-6 w-6" />,
      text: 'text-greyscale-text-title-800',
      onclick: handleChangeNameOpen,
      type: new Set(['folder', 'lessonNote']),
    },
    {
      id: 2,
      name: '노래 제목 변경',
      icon: <PencilGreyscale800Icon className="h-6 w-6" />,
      text: 'text-greyscale-text-title-800',
      onclick: handleChangeNameOpen,
      type: new Set(['music']),
    },
    {
      id: 3,
      name: '노트 선택',
      icon: <CheckGreyscale800Icon className="h-6 w-6" />,
      text: 'text-greyscale-text-title-800',
      onclick: handleChoiceNoteOpen,
      type: new Set(['folder']),
    },
    {
      id: 4,
      name: '폴더 이동',
      icon: <FolderGreyscale800Icon className="h-6 w-6" />,
      text: 'text-greyscale-text-title-800',
      onclick: handleMoveNoteOpen,
      type: new Set(['lessonNote']),
    },
    {
      id: 5,
      name: '삭제',
      icon: <TrashcanPoint600Icon className="h-6 w-6" />,
      text: 'text-point-600',
      onclick: handleDeleteNoteOpen,
      type: new Set(['folder', 'lessonNote', 'music']),
    },
  ];

  const changeContent = {
    folder: '폴더 이름 변경',
    lessonNote: '레슨 노트 이름 변경',
    music: '노래 제목 변경',
  };

  const deleteContent = {
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

  const selectionCount = selectedNoteIds.length;
  const selectionDeleteContent = {
    title: `${selectionCount}개의 노트를 삭제하시겠어요?`,
    content: '한 번 삭제한 레슨 노트는 복구할 수 없어요.',
  };

  return (
    <div>
      {noteSelectionMode ? (
        <>
          <div className="min-h-screen bg-greyscale-bg-100 pb-[74px] pt-[10px]">
            <NoteSelectionHeader
              folderName={title}
              selectedCount={selectionCount}
              onClose={handleSelectionModeClose}
              onToggleSelectAll={handleToggleSelectAll}
            />
            <div className="space-y-2 px-5">
              {notes.map(note => (
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
                    id ?? '',
                    isNoteType(type) ? type : 'folder',
                    title
                  )
                }
              />
            }
          />
          <div className="p-5">
            <div className="mb-4 flex items-center gap-1">
              {type === 'folder' ? (
                <FolderGreyscale800Icon className="h-6 w-6" />
              ) : (
                <MusicGreyscale800Icon className="h-6 w-6" />
              )}
              <span className="text-h2 text-greyscale-text-title-900">
                {title}
              </span>
            </div>
            <div>
              {notes.map(note => (
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
        onClose={() => setEtcMenuOpen(false)}
        showButton={false}
        showHeader={false}
      >
        <div className="space-y-2 pb-5">
          {folderBottomSheetOptions.map(
            option =>
              option.type.has(bottomSheetType) && (
                <div
                  key={option.id}
                  className="py-2 flex items-center gap-2.5"
                  onClick={option.onclick}
                >
                  {option.icon}
                  <span className={`text-subtitle2 ${option.text}`}>
                    {option.name}
                  </span>
                </div>
              )
          )}
        </div>
      </BottomSheet>

      {/* 변경 관련 모달 */}
      <InputModal
        isOpen={changeNameModalOpen}
        onClose={() => setChangeNameModalOpen(false)}
        title={changeContent[bottomSheetType]}
        defaultValue={selectedEntityName}
        onConfirm={handleChangeNameConfirm}
        maxLength={bottomSheetType === 'music' ? 28 : undefined}
      />

      {/* 삭제 관련 모달 */}
      <DialogModal
        type="two-buttons"
        isOpen={deleteNoteModalOpen}
        onClose={() => setDeleteNoteModalOpen(false)}
        title={
          noteSelectionMode
            ? selectionDeleteContent.title
            : deleteContent[bottomSheetType].title
        }
        content={
          noteSelectionMode
            ? selectionDeleteContent.content
            : deleteContent[bottomSheetType].content
        }
        primaryButtonText="삭제"
        secondaryButtonText="취소"
        onPrimaryClick={handleDeleteConfirm}
        onSecondaryClick={() => setDeleteNoteModalOpen(false)}
      />

      {/* 폴더 이동 관련 바텀시트 */}
      <BottomSheet
        isOpen={moveNoteModalOpen}
        onClose={() => setMoveNoteModalOpen(false)}
        title="폴더 이동"
        buttonText="확인"
        onButtonClick={handleMoveNoteConfirm}
        showHandle={false}
      >
        <SheetSelector
          options={folderMoveOptions}
          selected={selectedFolderId}
          onSelect={setSelectedFolderId}
          currentId={noteSelectionMode ? id : selectedEntityFolderId}
        />
      </BottomSheet>
    </div>
  );
}
