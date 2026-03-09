import React from 'react';
import CardListItem from './CardListItem';
import type { CardListProps } from './CardList.types';

const CardList: React.FC<CardListProps> = ({
  items,
  showTitle = true,
  showNumbering = false,
  className = '',
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`border border-greyscale-border-300 rounded-3xl px-5 py-1 ${className}`}
    >
      {items.map((item, index) => (
        <CardListItem
          key={item.id}
          data={item}
          index={index}
          showTitle={showTitle}
          showNumbering={showNumbering}
          isLastItem={index === items.length - 1}
        />
      ))}
    </div>
  );
};

export default CardList;
