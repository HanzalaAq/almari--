import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  image: string;
  viewedAt: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  clear: () => void;
}

const MAX_ITEMS = 20;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== item.id);
          return {
            items: [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS),
          };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'recently-viewed-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
