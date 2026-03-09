import type React from 'react';

export interface ListItemProps {
  /** 항목 텍스트 */
  label: string;
  /** 왼쪽 아이콘 (없으면 렌더링 안 됨) */
  icon?: React.ReactNode;
  /** 오른쪽 카운트 숫자/텍스트 (없으면 렌더링 안 됨) */
  count?: number | string;
  className?: string;
  onClick?: () => void;
}
