export interface CardListItemData {
  id: string;
  title?: string;
  content: string;
}

export interface CardListItemProps {
  data: CardListItemData;
  index?: number;
  showTitle?: boolean;
  showNumbering?: boolean;
  isLastItem?: boolean;
}

export interface CardListProps {
  items: CardListItemData[];
  showTitle?: boolean;
  showNumbering?: boolean;
  className?: string;
}
