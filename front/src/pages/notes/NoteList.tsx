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
import {
  useFolderNotes,
  useFolders,
  useSongNotes,
} from '@/hooks/useNoteBrowser';

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
  const [selectedFolderId, setSelectedFolderId] = useState('1');

  const folderMoveOptions = [
    { id: '1', name: '모든 노트' },
    { id: '2', name: '겨울 공연 연습' },
    { id: '3', name: '학교 연습' },
    { id: '4', name: '2025' },
  ];
  const [deleteNoteModalOpen, setDeleteNoteModalOpen] = useState(false);
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

  const handleEtcClick = (_id: string, type: NoteType) => {
    // id는 폴더나 노트의 고유 식별자 (예: 폴더 ID 또는 노트 ID)
    setEtcMenuOpen(true);
    setBottomSheetType(type);
  };

  const handleChangeNameOpen = () => {
    setEtcMenuOpen(false);
    setChangeNameModalOpen(true);
  };

  const handleChoiceNoteOpen = () => {
    setEtcMenuOpen(false);
  };

  const handleDeleteNoteOpen = () => {
    setEtcMenuOpen(false);
    setDeleteNoteModalOpen(true);
  };

  const handleMoveNoteOpen = () => {
    setEtcMenuOpen(false);
    setMoveNoteModalOpen(true);
  };

  const handleChangeNameConfirm = (newName: string) => {
    // 이름 변경 로직 구현 (type에 따라 다르게 처리)
    console.log('새 이름:', newName);
    setChangeNameModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    // 삭제 로직 구현
    console.log('폴더 삭제 확인');
    setDeleteNoteModalOpen(false);
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

  return (
    <div>
      <AppBar
        variant="icons-left-right-single"
        leftIcon={<BackGreyscale800Icon onClick={() => navigate(-1)} />}
        rightIcon={
          <EtcGreyscale800Icon
            onClick={() =>
              handleEtcClick('1', isNoteType(type) ? type : 'folder')
            }
          />
        }
      />
      <div className="p-5">
        <div className="flex items-center gap-1 mb-4">
          {type === 'folder' ? (
            <FolderGreyscale800Icon className="h-6 w-6" />
          ) : (
            <MusicGreyscale800Icon className="h-6 w-6" />
          )}
          <span className="text-greyscale-text-title-900 text-h2">
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
              onEtcClick={() => handleEtcClick(String(note.id), 'lessonNote')}
            />
          ))}
        </div>
      </div>

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
        defaultValue="기존 제목"
        onConfirm={handleChangeNameConfirm}
        maxLength={bottomSheetType === 'music' ? 28 : undefined}
      />

      {/* 삭제 관련 모달 */}
      <DialogModal
        type="two-buttons"
        isOpen={deleteNoteModalOpen}
        onClose={() => setDeleteNoteModalOpen(false)}
        title={deleteContent[bottomSheetType].title}
        content={deleteContent[bottomSheetType].content}
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
        showHandle={false}
      >
        <SheetSelector
          options={folderMoveOptions}
          selected={selectedFolderId}
          onSelect={setSelectedFolderId}
          currentId="2"
        />
      </BottomSheet>
    </div>
  );
}
