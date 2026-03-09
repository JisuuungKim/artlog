import { AppBar } from '@components/appBar';

export default function TopAppBar() {
  return (
    <AppBar
      variant="category-left-back-right-chip"
      title="카테고리명"
      chipLabel="이름"
    />
  );
}
