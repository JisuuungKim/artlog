import Button from '@/components/button/Button';
import { XPrimary500Icon } from '@/assets/icons';
import type { SheetOption } from '@/components/bottomSheet';
import AddDirectlyButton from '@/components/common/AddDirectlyButton';

interface SongSelectorProps {
  songs?: SheetOption[];
  selectedSongs?: string[];
  setSelectedSongs?: (songs: string[]) => void;
  showAllSongs?: boolean;
  setShowAllSongs?: (show: boolean) => void;
  handleSongButtonClick?: (songName: string) => void;
  handleAddSongDirectly?: () => void;
  songMap?: Map<string, string>;
}

export default function SongSelector({
  songs = [],
  selectedSongs = [],
  setSelectedSongs,
  showAllSongs = false,
  setShowAllSongs,
  handleSongButtonClick,
  handleAddSongDirectly,
  songMap = new Map(),
}: SongSelectorProps) {
  return (
    <>
      <div className="flex gap-2 flex-wrap items-center pb-7">
        {handleAddSongDirectly && (
          <AddDirectlyButton onClick={handleAddSongDirectly}>
            직접 추가
          </AddDirectlyButton>
        )}
        {(showAllSongs ? songs : songs.slice(0, 5)).map(song => (
          <Button
            key={song.id}
            hierarchy={
              handleSongButtonClick && selectedSongs.includes(song.id)
                ? 'secondary-color'
                : 'secondary-grey'
            }
            size="small"
            onClick={
              handleSongButtonClick
                ? () => handleSongButtonClick(song.id)
                : undefined
            }
          >
            {song.name}
          </Button>
        ))}
        {songs.length > 5 && (
          <p
            className="text-primary-500 text-label p-2 cursor-pointer"
            onClick={() => setShowAllSongs?.(!showAllSongs)}
          >
            {showAllSongs ? '접기' : `+${songs.length - 5} 더보기`}
          </p>
        )}
      </div>
      <div
        className={`${selectedSongs.length > 0 ? 'border-t' : ''} border-greyscale-disabled-200 py-4 w-full flex gap-2 flex-wrap`}
      >
        {selectedSongs.map((songId, index) => (
          <Button
            key={index}
            hierarchy="secondary-color"
            iconPosition="trailing"
            icon={<XPrimary500Icon />}
            iconOnClick={() => {
              setSelectedSongs?.(selectedSongs.filter(id => id !== songId));
            }}
            size="small"
          >
            {songMap.get(songId) || ''}
          </Button>
        ))}
      </div>
    </>
  );
}
