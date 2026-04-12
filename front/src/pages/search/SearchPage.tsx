import AppBar from '@/components/appBar';
import {
  BackGreyscale800Icon,
  XGreyscale300Icon,
} from '@/assets/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const INITIAL_RECENT_SEARCHES = ['고음', '발성부터', '다시'];

function SearchSectionHeader({
  title,
  actionLabel,
  onActionClick,
}: {
  title: string;
  actionLabel: string;
  onActionClick: () => void;
}) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-subtitle3 text-greyscale-text-title-900">{title}</h2>
      <button
        type="button"
        onClick={onActionClick}
        className="py-0.5 text-caption1 text-greyscale-neutral-600"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function RecentSearchRow({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="truncate text-body1 text-greyscale-text-title-800">{label}</p>
      <button
        type="button"
        aria-label={`${label} 삭제`}
        onClick={onDelete}
        className="ml-3 flex h-5 w-5 items-center justify-center"
      >
        <XGreyscale300Icon className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);

  const handleDeleteSearch = (target: string) => {
    setRecentSearches(searches => searches.filter(search => search !== target));
  };

  const handleClearSearches = () => {
    setRecentSearches([]);
  };

  return (
    <div className="min-h-screen bg-greyscale-bg-50">
      <AppBar
        variant="category-left-back-search"
        title="보컬"
        leftIcon={<BackGreyscale800Icon className="h-6 w-6" />}
        leftIconClick={() => navigate(-1)}
      />

      <main className="px-5 py-6">
        <section className="flex flex-col gap-4">
          <SearchSectionHeader
            title="최근 검색어"
            actionLabel="전체 삭제"
            onActionClick={handleClearSearches}
          />
          <div className="flex flex-col">
            {recentSearches.map(search => (
              <RecentSearchRow
                key={search}
                label={search}
                onDelete={() => handleDeleteSearch(search)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
