export interface MiniTabItem {
  id: string;
  label: string;
}

export interface MiniTabsProps {
  tabs: MiniTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}
