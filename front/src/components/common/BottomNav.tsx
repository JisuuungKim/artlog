import { Link, useSearchParams } from 'react-router-dom';

type BottomNavProps = {
  // activeTab prop 제거
};

// SVG Icons
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? '#2e2e38' : 'none'}
    stroke={active ? 'none' : '#8d8d9a'}
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

const FolderIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? '#2e2e38' : 'none'}
    stroke={active ? 'none' : '#8d8d9a'}
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={active ? '#2e2e38' : 'none'}
    stroke={active ? 'none' : '#8d8d9a'}
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const navItems = [
  { id: 1, tab: 'home', label: '홈', icon: HomeIcon },
  { id: 2, tab: 'notes', label: '검색', icon: FolderIcon },
  { id: 3, tab: 'profile', label: '프로필', icon: UserIcon },
];

export default function BottomNav({}: BottomNavProps) {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'home';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#f9f9fb] border-t border-[#ebebef] h-12 flex items-center justify-center gap-20 px-15 w-full max-w-[480px] mx-auto">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.tab;
        return (
          <Link
            key={item.id}
            to={`/?tab=${item.tab}`}
            className="flex-1 flex items-center justify-center h-12 transition-colors"
            aria-label={item.label}
          >
            <Icon active={isActive} />
          </Link>
        );
      })}
    </nav>
  );
}
