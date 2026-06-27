import { useEffect, useRef } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from './components/common/BottomNav';
import LyricsButton from './components/fab/LyricsButton';
import { FabButton } from './components/fab';
import { api, type ApiResponse } from './lib/api';
import type { LessonNoteDetail } from './hooks/useLessonNote';
import { trackEvent } from './lib/mixpanel';

function toPageName(pathname: string, search: string): string {
  if (pathname === '/') {
    const tab = new URLSearchParams(search).get('tab') ?? 'home';
    return ({ home: 'home', notes: 'notes', mypage: 'mypage' } as Record<string, string>)[tab] ?? 'home';
  }
  if (pathname.startsWith('/lessons/new/condition')) return 'lesson_create_condition';
  if (pathname.startsWith('/lessons/new')) return 'lesson_create';
  if (/^\/lessons\/\d+\/lyrics/.test(pathname)) return 'lesson_lyrics';
  if (/^\/lessons\/\d+/.test(pathname)) return 'lesson_detail';
  if (pathname === '/auth/login') return 'login';
  if (pathname === '/auth/callback') return 'auth_callback';
  if (pathname === '/auth/terms') return 'terms';
  if (/^\/auth\/terms\//.test(pathname)) return 'term_detail';
  if (pathname === '/onboarding/interests') return 'onboarding_interests';
  if (pathname === '/search') return 'search';
  if (pathname === '/notification/settings') return 'notification_settings';
  if (pathname === '/notification') return 'notification';
  if (pathname.startsWith('/mypage/')) {
    const sub = pathname.split('/')[2] ?? '';
    return `mypage_${sub.replace(/-/g, '_')}`;
  }
  if (/^\/notes\//.test(pathname)) return 'note_list';
  return 'page';
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // page_viewed: fires on pathname change; for '/' also fires on tab (search) change
  const lastPageKeyRef = useRef<string | null>(null);
  const pageKey =
    location.pathname === '/'
      ? `${location.pathname}${location.search}`
      : location.pathname;
  useEffect(() => {
    if (lastPageKeyRef.current === pageKey) return;
    lastPageKeyRef.current = pageKey;
    trackEvent('page_viewed', {
      page_name: toPageName(location.pathname, location.search),
      path: location.pathname,
    });
  }, [pageKey, location.pathname, location.search]);
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
    <div className="safe-pt h-[100dvh] bg-greyscale-bg-100 w-full max-w-[480px] mx-auto flex flex-col">
      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide bg-greyscale-bg-100 ${showBottomNav ? 'pb-bottom-nav-safe' : 'safe-pb'}`}
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
