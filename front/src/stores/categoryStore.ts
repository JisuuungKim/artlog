import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CategoryStore = {
  selectedCategoryId: string;
  setSelectedCategoryId: (categoryId: string) => void;
};

export const useCategoryStore = create<CategoryStore>()(
  persist(
    set => ({
      selectedCategoryId: '',
      setSelectedCategoryId: categoryId =>
        set({ selectedCategoryId: categoryId }),
    }),
    {
      name: 'artlog-selected-category',
    }
  )
);
