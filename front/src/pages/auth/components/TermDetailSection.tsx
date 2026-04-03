import type {
  TermContentBlock,
  TermOrderedListItem,
  TermSection,
} from '../termDetail.types';

interface OrderedListProps {
  items: TermOrderedListItem[];
  depth?: number;
}

function OrderedList({ items, depth = 1 }: OrderedListProps) {
  return (
    <ol
      className={`space-y-1 text-body2 text-greyscale-text-body-700 ${
        depth === 1 ? 'pl-[21px]' : 'pl-[21px] pt-1'
      }`}
    >
      {items.map(item => {
        const key = typeof item === 'string' ? item : item.text;

        return (
          <li key={key} className="list-decimal leading-5">
            {typeof item === 'string' ? (
              item
            ) : (
              <>
                <span>{item.text}</span>
                {item.children?.length ? (
                  <OrderedList items={item.children} depth={depth + 1} />
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ContentBlock({ block }: { block: TermContentBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p className="whitespace-pre-line text-body2 text-greyscale-text-body-700">
        {block.text}
      </p>
    );
  }

  return <OrderedList items={block.items} />;
}

export default function TermDetailSection({ title, blocks }: TermSection) {
  return (
    <section className="space-y-3">
      <h2 className="text-subtitle3 text-greyscale-text-title-900">{title}</h2>
      <div className="space-y-3">
        {blocks.map(block => (
          <ContentBlock
            key={
              block.type === 'paragraph'
                ? block.text
                : block.items
                    .map(item => (typeof item === 'string' ? item : item.text))
                    .join('-')
            }
            block={block}
          />
        ))}
      </div>
    </section>
  );
}
