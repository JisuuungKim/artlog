import { SearchSmallGreyscale500Icon } from '@assets/icons';

interface AppBarSearchFieldProps {
  value?: string;
  placeholder?: string;
}

export default function AppBarSearchField({
  value,
  placeholder = '검색어를 입력해주세요.',
}: AppBarSearchFieldProps) {
  return (
    <div className="flex w-full items-center gap-1 rounded-[100px] border border-greyscale-border-300 px-[10px] py-[6px]">
      <SearchSmallGreyscale500Icon className="h-5 w-5 shrink-0" />
      <span
        className={[
          'truncate text-body1',
          value ? 'text-primary-300' : 'text-greyscale-text-disabled-500',
        ].join(' ')}
      >
        {value || placeholder}
      </span>
    </div>
  );
}
