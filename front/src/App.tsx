import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from './components/common/BottomNav';
import LyricsButton from './components/fab/LyricsButton';
import { FabButton } from './components/fab';
import { api, type ApiResponse } from './lib/api';
import type { LessonNoteDetail } from './hooks/useLessonNote';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const lessonDetailMatch = location.pathname.match(/^\/lessons\/(\d+)$/);
  const lessonNoteId = lessonDetailMatch?.[1];
  const { data: lessonNote } = useQuery({
    queryKey: ['lesson-note', lessonNoteId],
    enabled: Boolean(lessonNoteId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LessonNoteDetail>>(
        `/api/v1/notes/${lessonNoteId}`
      );
      return response.data.data;
    },
  });

  // '/' 경로일 때만 BottomNav 표시
  const showBottomNav = location.pathname === '/';

  const showLyricsButton = lessonNote?.status === 'COMPLETED';

  // '/' 또는 '/?tab=home' 경로일 때만 FabButton 표시
  const showFabButton =
    location.pathname === '/' &&
    (location.search === '' || location.search === '?tab=home');

  return (
    <div className="h-screen bg-greyscale-bg-100 w-full max-w-[480px] mx-auto flex flex-col">
      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide ${showBottomNav ? 'pb-12' : ''}`}
      >
        <Outlet />
      </main>
      {showBottomNav && <BottomNav />}

      {/* FAB */}
      <div className="relative">
        {showLyricsButton && (
          <LyricsButton
            onClick={() => navigate(`/lessons/${lessonNoteId}/lyrics`)}
          />
        )}
        {showFabButton && <FabButton />}
      </div>
    </div>
  );
}

export default App;
