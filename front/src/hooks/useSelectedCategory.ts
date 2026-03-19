import { useEffect } from 'react';
import type { CategorySummary } from '@/hooks/useNoteBrowser';
import { useCategoryStore } from '@/stores/categoryStore';

export function useSelectedCategory(categories: CategorySummary[]) {
  const selectedCategoryId = useCategoryStore(state => state.selectedCategoryId);
  const setSelectedCategoryId = useCategoryStore(
    state => state.setSelectedCategoryId
  );

  useEffect(() => {
    if (!categories.length) {
      return;
    }

    if (!selectedCategoryId) {
      setSelectedCategoryId(String(categories[0].id));
      return;
    }

    const exists = categories.some(
      category => String(category.id) === selectedCategoryId
    );

    if (!exists) {
      setSelectedCategoryId(String(categories[0].id));
    }
  }, [categories, selectedCategoryId, setSelectedCategoryId]);

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    effectiveSelectedCategoryId:
      selectedCategoryId || String(categories[0]?.id ?? ''),
  };
}
