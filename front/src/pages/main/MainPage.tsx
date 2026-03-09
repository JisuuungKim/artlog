import { useSearchParams } from 'react-router-dom';
import Home from './Home';
import Folder from './Folder';
import Profile from './Profile';

export default function MainPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'home';

  const renderContent = () => {
    switch (tab) {
      case 'notes':
        return <Folder />;
      case 'profile':
        return <Profile />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return <div>{renderContent()}</div>;
}
