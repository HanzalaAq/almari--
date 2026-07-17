import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: any | null;
  profile: any | null;
  setAuth: (user: User | null, session: any | null) => void;
  setProfile: (profile: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      setAuth: (user, session) => set({ user, session }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ user: null, session: null, profile: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
