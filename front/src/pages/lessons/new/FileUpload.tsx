import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '@/components/button/Button';
import Chip from '@/components/common/Chip';
import Checkbox from '@/components/checkbox';
import { BottomSheet, SheetSelector } from '@/components/bottomSheet';
import type { SheetOption } from '@/components/bottomSheet';
import { useTextInput } from '@/components/textInput';
import {
  ArrowRightGreyscale500Icon,
  PlusGreyscale500Icon,
} from '@/assets/icons';
import SongSelector from '@/pages/lessons/new/components/SongSelector';
import TextInput from '@/components/textInput';
import InputButton from '@/components/common/InputButton';
import DialogModal from '@/components/modal/DialogModal';
import { useCreateLessonNote } from '@/hooks/useLessonNote';

// dummy data
const categories: SheetOption[] = [
  { id: '1', name: '보컬' },
  { id: '2', name: '피아노' },
  { id: '3', name: '연기' },
];

const folders: SheetOption[] = [
  { id: '1', name: '모든노트' },
  { id: '2', name: '겨울공연' },
  { id: '3', name: '2026' },
];

const songs: SheetOption[] = [
  { id: '1', name: '누가 울새를 죽였니' },
  { id: '2', name: '작은 별' },
  { id: '3', name: '생일 축하합니다' },
  { id: '4', name: 'New life' },
  { id: '5', name: '나를 지킨다는 것' },
  { id: '6', name: '사랑이란' },
];

// todo: 더보기 버튼 눌렀을 때 바텀시트 높이 조절 구현
export default function FileUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const createLessonNoteMutation = useCreateLessonNote();

  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const [selectedFolderId, setSelectedFolderId] = useState('1');
  const [memoText, setMemoText] = useState('');
  const [uploadedAudioPath, setUploadedAudioPath] = useState<string | null>(null);

  const [noLessonSong, setNoLessonSong] = useState(false);

  const [bottomSheetTitle, setBottomSheetTitle] = useState('카테고리');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);

  // 특정 모달들 show 여부
  const [modalsVisibility] = useState({
    iphoneInfo: true,
    mobileData: true,
  });

  // 현재 보여줄 모달 추적
  const [currentModal, setCurrentModal] = useState<
    'none' | 'iphoneInfo' | 'mobileData'
  >('none');

  // 모달 체크박스 상태 관리
  const [mobileDataChecked, setMobileDataChecked] = useState(false);

  const titleInput = useTextInput('');
  const songInput = useTextInput('');

  // URL 파라미터를 확인해서 state 업데이트
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const title = searchParams.get('title');
    const cat = searchParams.get('cat');
    const fld = searchParams.get('fld');
    const songs = searchParams.get('songs');
    const memo = searchParams.get('memo') || '';

    if (title) {
      titleInput.setValue(title);
    }

    if (cat) {
      setSelectedCategoryId(cat);
    }

    if (fld) {
      setSelectedFolderId(fld);
    }

    if (songs) {
      const songIds = songs.split(',').filter(id => id.trim() !== '');
      setSelectedSongIds(songIds);
    }

    if (memo) {
      setMemoText(memo);
    }
  }, [location.search]);

  useEffect(() => {
    const pendingAudio = sessionStorage.getItem('pendingLessonAudio');
    if (!pendingAudio) {
      return;
    }

    try {
      const parsed = JSON.parse(pendingAudio) as { uploadedAudioPath?: string };
      setUploadedAudioPath(parsed.uploadedAudioPath ?? null);
    } catch {
      setUploadedAudioPath(null);
    }
  }, []);

  // 오늘 배운 곡이 없어요 체크 시 선택된 곡 초기화
  useEffect(() => {
    if (noLessonSong) {
      setSelectedSongIds([]);
    }
  }, [noLessonSong]);

  // useMemo로 검색용 Map 생성
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach(folder => map.set(folder.id, folder.name));
    return map;
  }, [folders]);

  const songMap = useMemo(() => {
    const map = new Map<string, string>();
    songs.forEach(song => map.set(song.id, song.name));
    return map;
  }, [songs]);

  // 바텀시트 열기 함수
  const handleBottomSheetOpen = (title: string) => {
    setBottomSheetTitle(title);
    setIsBottomSheetOpen(true);
  };

  // 바텀시트 닫기 함수
  const handleConfirm = () => {
    setIsBottomSheetOpen(false);
  };

  // 곡 선택 버튼 클릭 핸들러
  const handleSongButtonClick = (songId: string) => {
    if (!selectedSongIds.includes(songId)) {
      setSelectedSongIds([...selectedSongIds, songId]);
    } else {
      setSelectedSongIds(selectedSongIds.filter(id => id !== songId));
    }
  };

  // 곡 직접 추가 버튼 클릭 핸들러
  const handleAddSongDirectly = () => {
    setBottomSheetTitle('곡 직접 추가');
  };

  // 곡 직접 추가에서 뒤로가기 버튼 클릭 핸들러
  const handleBackFromAddSong = () => {
    setBottomSheetTitle('레슨 곡 선택');
  };

  // 컨디션 입력 버튼 클릭 핸들러
  const handleConditionClick = () => {
    const params = new URLSearchParams();

    if (titleInput.value) {
      params.append('title', titleInput.value);
    }

    params.append('cat', selectedCategoryId);
    params.append('fld', selectedFolderId);

    if (selectedSongIds.length > 0) {
      params.append('songs', selectedSongIds.join(','));
    }

    if (memoText) {
      params.append('memo', memoText);
    }

    navigate(`/lessons/new/condition?${params.toString()}`);
  };

  const handleUpload = () => {
    if (!uploadedAudioPath) {
      console.error('업로드된 오디오 파일이 없습니다.');
      return;
    }

    // 첫 번째로 보여줄 모달 결정
    if (modalsVisibility.iphoneInfo) {
      setCurrentModal('iphoneInfo');
    } else if (modalsVisibility.mobileData) {
      setCurrentModal('mobileData');
    } else {
      // 모든 모달이 false면 바로 업로드 진행
      console.log('업로드 진행!');
    }
  };

  // 모달 닫기 및 다음 모달로 넘어가는 함수
  const handleModalClose = () => {
    if (currentModal === 'iphoneInfo') {
      if (modalsVisibility.mobileData) {
        setCurrentModal('mobileData');
      } else {
        setCurrentModal('none');
        submitLessonNote();
      }
    } else if (currentModal === 'mobileData') {
      setCurrentModal('none');
      submitLessonNote();
    }
  };

  const submitLessonNote = () => {
    if (!uploadedAudioPath) {
      return;
    }

    const songTitles = selectedSongIds
      .map(songId => songMap.get(songId))
      .filter((songTitle): songTitle is string => Boolean(songTitle));

    createLessonNoteMutation.mutate(
      {
        title: titleInput.value,
        folderId: Number(selectedFolderId),
        conditionText: memoText,
        songTitles,
        uploadedAudioPath,
      },
      {
        onSuccess: created => {
          sessionStorage.removeItem('pendingLessonAudio');
          navigate(`/lessons/${created.id}`);
        },
      }
    );
  };

  // 바텀시트 콘텐츠 렌더링 함수
  const renderBottomSheetContent = () => {
    if (bottomSheetTitle === '카테고리') {
      return (
        <SheetSelector
          options={categories}
          selected={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      );
    } else if (bottomSheetTitle === '폴더') {
      return (
        <SheetSelector
          options={folders}
          selected={selectedFolderId}
          onSelect={setSelectedFolderId}
        />
      );
    } else if (bottomSheetTitle === '레슨 곡 선택') {
      return (
        <SongSelector
          songs={songs}
          selectedSongs={selectedSongIds}
          setSelectedSongs={setSelectedSongIds}
          showAllSongs={showAllSongs}
          setShowAllSongs={setShowAllSongs}
          handleSongButtonClick={handleSongButtonClick}
          handleAddSongDirectly={handleAddSongDirectly}
          songMap={songMap}
        />
      );
    } else if (bottomSheetTitle === '곡 직접 추가') {
      return (
        // 곡 직접 추가 content
        <div className="flex w-full gap-2">
          <TextInput
            isTyping={songInput.isTyping}
            isFocused={songInput.isFocused}
            variant="full"
            value={songInput.value}
            onChange={songInput.onChange}
            onFocus={songInput.onFocus}
            onBlur={songInput.onBlur}
            onClear={songInput.onClear}
            placeholder="곡 이름을 입력해주세요"
            maxLength={28}
          />
          <Button
            hierarchy="primary"
            size="medium"
            disabled={songInput.value.trim() === ''}
            onClick={handleBackFromAddSong}
          >
            추가
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col bg-greyscale-bg-50 min-h-screen">
      {/* Content */}
      <div className="flex-1 px-5">
        {/* Note Title Section */}
        <div className="py-8 flex flex-col gap-1">
          <p className="text-caption1 text-greyscale-neutral-600">
            노트 이름을 입력해주세요
          </p>
          <div>
            <input
              type="text"
              value={titleInput.value}
              onChange={titleInput.onChange}
              onFocus={titleInput.onFocus}
              onBlur={titleInput.onBlur}
              placeholder="2026.01.20. 레슨노트"
              className={`w-full text-h2 outline-none placeholder-greyscale-border-300 ${
                titleInput.value
                  ? 'text-greyscale-text-title-900'
                  : 'text-greyscale-border-300'
              }`}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-6">
          {/* 카테고리 행 */}
          <div className="flex items-center gap-x-3">
            <p className="w-12 text-greyscale-text-disabled-500 text-label whitespace-nowrap self-stretch mt-1.5">
              카테고리
            </p>
            <div>
              <div className="flex flex-wrap">
                <Chip
                  variant="filter"
                  onClick={() => handleBottomSheetOpen('카테고리')}
                >
                  {categoryMap.get(selectedCategoryId) || '보컬'}
                </Chip>
              </div>
              <p className="text-caption2 text-primary-500 mt-2">
                정확한 분석을 위해 올바른 카테고리를 선택해주세요.
              </p>
            </div>
          </div>

          {/* 폴더 행 */}
          <div className="flex items-center gap-x-3">
            <p className="w-12 text-label text-greyscale-text-disabled-500 whitespace-nowrap self-stretch mt-1.5">
              폴더
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip
                variant="filter"
                onClick={() => handleBottomSheetOpen('폴더')}
              >
                {folderMap.get(selectedFolderId) || '모든노트'}
              </Chip>
            </div>
          </div>

          {/* 레슨곡 행 */}
          <div className="flex items-center gap-x-3">
            <p className="w-12 text-label text-greyscale-text-disabled-500 whitespace-nowrap self-stretch mt-1.5">
              레슨 곡
            </p>
            <div>
              <div className="flex flex-wrap gap-2">
                <Chip
                  variant="default"
                  icon={ArrowRightGreyscale500Icon}
                  showIcon
                  onClick={() => handleBottomSheetOpen('레슨 곡 선택')}
                >
                  레슨 곡 선택
                </Chip>
                {selectedSongIds.map((songId, index) => {
                  const songName = songMap.get(songId);
                  return songName ? (
                    <Chip key={index} variant="filter">
                      {songName}
                    </Chip>
                  ) : null;
                })}
              </div>
              <div className="flex items-center mt-2">
                <Checkbox
                  checked={noLessonSong}
                  onChange={setNoLessonSong}
                  label="오늘 배운 레슨 곡이 없어요."
                />
              </div>
            </div>
          </div>

          {/* 컨디션 행 */}
          <div className="flex items-center gap-x-3">
            <p className="w-12 text-label text-greyscale-text-disabled-500 whitespace-nowrap self-stretch mt-1.5">
              컨디션
            </p>
            {memoText ? (
              <div className="flex flex-col flex-1">
                <InputButton
                  placeholder={memoText}
                  onClick={handleConditionClick}
                />
              </div>
            ) : (
              <Chip
                variant="default"
                showIcon
                icon={PlusGreyscale500Icon}
                onClick={handleConditionClick}
              >
                오늘 레슨 컨디션
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="flex items-center justify-center px-2 py-4">
        <p className="text-caption1 text-greyscale-neutral-600 tracking-tight">
          최대 1시간 분량까지 업로드 가능해요.
        </p>
      </div>

      {/* Bottom Button */}
      <div className="px-5 pb-5">
        <Button
          hierarchy="primary"
          size="large"
          disabled={
            (selectedSongIds.length === 0 && !noLessonSong) ||
            !uploadedAudioPath ||
            createLessonNoteMutation.isPending
          }
          className="w-full"
          onClick={handleUpload}
        >
          녹음 파일 업로드
        </Button>
      </div>

      {/* BottomSheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleConfirm}
        title={bottomSheetTitle}
        buttonText="확인"
        headerType={bottomSheetTitle === '곡 직접 추가' ? 'left' : 'center'}
        onBack={handleBackFromAddSong}
        showButton={bottomSheetTitle !== '곡 직접 추가'}
      >
        {renderBottomSheetContent()}
      </BottomSheet>

      {/* iPhone 정보 모달 */}
      <DialogModal
        type="two-buttons"
        title="아이폰 파일 업로드 안내"
        content="아이폰 기본 녹음 앱으로 녹음한 파일은 ‘iCloud Drive’ 혹은 ‘나의 iPhone’에 저장한 경우에만 업로드가 가능합니다."
        primaryButtonText="확인"
        secondaryButtonText="다시 보지 않기"
        isOpen={currentModal === 'iphoneInfo'}
        onClose={handleModalClose}
        onPrimaryClick={handleModalClose}
        onSecondaryClick={handleModalClose}
      />

      {/* 모바일 데이터 모달 */}
      <DialogModal
        type="two-buttons-with-checkbox"
        title="모바일 데이터 사용"
        content="Wi-Fi 환경이 아니에요. 사용 중인 데이터 요금제에 따라 요금이 부과될 수 있어요."
        primaryButtonText="확인"
        secondaryButtonText="취소"
        isOpen={currentModal === 'mobileData'}
        checkboxChecked={mobileDataChecked}
        onCheckboxChange={setMobileDataChecked}
        onClose={handleModalClose}
        onPrimaryClick={handleModalClose}
        onSecondaryClick={handleModalClose} // todo: 취소 버튼 구현
      />
    </div>
  );
}
