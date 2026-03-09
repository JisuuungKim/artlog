import { useLocation, Outlet } from 'react-router-dom';
import BottomNav from './components/common/BottomNav';
import LyricsButton from './components/fab/LyricsButton';
import { FabButton } from './components/fab';

function App() {
  const location = useLocation();

  // 디버그: 현재 경로 출력
  console.log('Current pathname:', location.pathname);

  // '/' 경로일 때만 BottomNav 표시
  const showBottomNav = location.pathname === '/';

  // '/lessons/:id' 경로일 때만 LyricsButton 표시 (하위 경로 제외)
  const showLyricsButton = /^\/lessons\/[^/]+$/.test(location.pathname);

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
        {showLyricsButton && <LyricsButton />}
        {showFabButton && <FabButton />}
      </div>
    </div>
  );
}

export default App;
