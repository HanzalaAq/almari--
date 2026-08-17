import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: Set<string>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setFavorites: (ids: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: new Set<string>(),
      addFavorite: (id: string) =>
        set((state) => {
          const next = new Set(state.favoriteIds);
          next.add(id);
          return { favoriteIds: next };
        }),
      removeFavorite: (id: string) =>
        set((state) => {
          const next = new Set(state.favoriteIds);
          next.delete(id);
          return { favoriteIds: next };
        }),
      isFavorite: (id: string) => get().favoriteIds.has(id),
      setFavorites: (ids: string[]) =>
        set({ favoriteIds: new Set(ids) }),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ favoriteIds: Array.from(state.favoriteIds) }),
      merge: (persisted: any, current) => ({
        ...current,
        favoriteIds: new Set(persisted?.favoriteIds || []),
      }),
    }
  )
);
