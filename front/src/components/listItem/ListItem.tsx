import type { ListItemProps } from './List.types';

export function ListItem({
  label,
  icon,
  count,
  className,
  onClick,
}: ListItemProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`flex w-full items-center gap-6 py-2 text-left ${className ?? ''}`}
      onClick={onClick}
    >
      {/* 왼쪽: 아이콘 + 텍스트 */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {icon && (
          <span className="flex size-6 shrink-0 items-center justify-center text-greyscale-text-title-800">
            {icon}
          </span>
        )}
        <p className="text-subtitle3 min-w-0 flex-1 truncate text-greyscale-text-title-800">
          {label}
        </p>
      </div>

      {/* 오른쪽: 카운트 */}
      {count !== undefined && (
        <p className="text-body1 shrink-0 text-right text-greyscale-text-disabled-500">
          {count}
        </p>
      )}
    </Tag>
  );
}
