import { Navigate, useSearchParams } from 'react-router-dom';
import { authTokenStorage } from '@/lib/auth-token';
import Home from './Home';
import Folder from './Folder';
import Mypage from '../mypage/Mypage';

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const isLoggedIn = Boolean(authTokenStorage.get());
  const tab = searchParams.get('tab') || 'home';

  // 로그인 안 된 상태로 메인 진입 시 로그인 화면으로
  if (!isLoggedIn) {
    return <Navigate to="/auth/login" replace />;
  }

  const renderContent = () => {
    switch (tab) {
      case 'notes':
        return <Folder />;
      case 'mypage':
        return <Mypage />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return <div className="min-h-full bg-greyscale-bg-100">{renderContent()}</div>;
}
