import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '@/components/button/Button';
import Chip from '@/components/common/Chip';
import Checkbox from '@/components/checkbox';
import {
  AddDirectlyContent,
  BottomSheet,
  SheetSelector,
} from '@/components/bottomSheet';
import { useTextInput } from '@/components/textInput';
import {
  ArrowRightGreyscale500Icon,
  PlusGreyscale500Icon,
} from '@/assets/icons';
import SongSelector from '@/pages/lessons/new/components/SongSelector';
import InputButton from '@/components/common/InputButton';
import DialogModal from '@/components/modal/DialogModal';
import { useCreateLessonNote } from '@/hooks/useLessonNote';
import {
  useCategories,
  useFolders,
  useSongs,
} from '@/hooks/useNoteBrowser';
import { useSelectedCategory } from '@/hooks/useSelectedCategory';

const isSameStringArray = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

// todo: 더보기 버튼 눌렀을 때 바텀시트 높이 조절 구현
export default function FileUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const createLessonNoteMutation = useCreateLessonNote();
  const { data: categoriesData = [] } = useCategories();
  const { effectiveSelectedCategoryId, setSelectedCategoryId } =
    useSelectedCategory(categoriesData);

  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
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
  const { data: foldersData = [] } = useFolders(effectiveSelectedCategoryId || undefined);
  const { data: songsData = [] } = useSongs(effectiveSelectedCategoryId || undefined);
  const effectiveSelectedFolderId =
    selectedFolderId || String(foldersData[0]?.id ?? '');
  const selectedCategoryName =
    categoriesData.find(
      category => String(category.id) === effectiveSelectedCategoryId
    )?.name ?? '관심 카테고리 없음';
  const selectedFolderName =
    foldersData.find(folder => String(folder.id) === effectiveSelectedFolderId)
      ?.name ?? '모든노트';
  const getSongTitle = (songId: string) =>
    songsData.find(song => String(song.id) === songId)?.title ?? '';

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
      setSelectedFolderId(previous => (previous === fld ? previous : fld));
    }

    if (songs) {
      const songIds = songs.split(',').filter(id => id.trim() !== '');
      setSelectedSongIds(previous =>
        isSameStringArray(previous, songIds) ? previous : songIds
      );
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

  useEffect(() => {
    if (!foldersData.length) {
      setSelectedFolderId(previous => (previous === '' ? previous : ''));
      return;
    }

    const hasSelectedFolder = foldersData.some(
      folder => String(folder.id) === selectedFolderId
    );

    if (!hasSelectedFolder) {
      const firstFolderId = String(foldersData[0].id);
      setSelectedFolderId(previous =>
        previous === firstFolderId ? previous : firstFolderId
      );
    }
  }, [foldersData, selectedFolderId]);

  useEffect(() => {
    const validSongIds = new Set(songsData.map(song => String(song.id)));

    setSelectedSongIds(previous => {
      const next = previous.filter(songId => validSongIds.has(songId));
      return isSameStringArray(previous, next) ? previous : next;
    });
  }, [songsData]);

  // 오늘 배운 곡이 없어요 체크 시 선택된 곡 초기화
  useEffect(() => {
    if (noLessonSong) {
      setSelectedSongIds([]);
    }
  }, [noLessonSong]);

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
    setSelectedSongIds(previous =>
      previous.includes(songId)
        ? previous.filter(id => id !== songId)
        : [...previous, songId]
    );
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

    params.append('cat', effectiveSelectedCategoryId);
    if (effectiveSelectedFolderId) {
      params.append('fld', effectiveSelectedFolderId);
    }

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
    if (!uploadedAudioPath || !effectiveSelectedCategoryId || !effectiveSelectedFolderId) {
      return;
    }

    const songTitles = selectedSongIds
      .map(getSongTitle)
      .filter((songTitle): songTitle is string => Boolean(songTitle));

    createLessonNoteMutation.mutate(
      {
        title: titleInput.value,
        folderId: Number(effectiveSelectedFolderId),
        categoryId: Number(effectiveSelectedCategoryId),
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
          options={categoriesData}
          selected={effectiveSelectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      );
    } else if (bottomSheetTitle === '폴더') {
      return (
        <SheetSelector
          options={foldersData}
          selected={effectiveSelectedFolderId}
          onSelect={setSelectedFolderId}
        />
      );
    } else if (bottomSheetTitle === '레슨 곡 선택') {
      return (
        <SongSelector
          songs={songsData}
          selectedSongs={selectedSongIds}
          setSelectedSongs={setSelectedSongIds}
          showAllSongs={showAllSongs}
          setShowAllSongs={setShowAllSongs}
          handleSongButtonClick={handleSongButtonClick}
          handleAddSongDirectly={handleAddSongDirectly}
        />
      );
    } else if (bottomSheetTitle === '곡 직접 추가') {
      return (
        <AddDirectlyContent
          inputProps={{
            isTyping: songInput.isTyping,
            isFocused: songInput.isFocused,
            value: songInput.value,
            onChange: songInput.onChange,
            onFocus: songInput.onFocus,
            onBlur: songInput.onBlur,
            onClear: songInput.onClear,
          }}
          onAdd={handleBackFromAddSong}
          placeholder="곡 이름을 입력해주세요"
        />
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
                  {selectedCategoryName}
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
                {selectedFolderName}
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
                  const songName = getSongTitle(songId);
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
            !effectiveSelectedCategoryId ||
            !effectiveSelectedFolderId ||
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
