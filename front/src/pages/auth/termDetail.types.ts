export type TermOrderedListItem =
  | string
  | {
      text: string;
      children?: string[];
    };

export type TermContentBlock =
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'ordered-list';
      items: TermOrderedListItem[];
    };

export interface TermSection {
  title: string;
  blocks: TermContentBlock[];
}

export interface TermDetailContent {
  title: string;
  intro?: string[];
  sections: TermSection[];
}

export type TermDetailContentMap = Record<string, TermDetailContent>;
