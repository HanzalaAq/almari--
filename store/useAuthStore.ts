import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  city: string;
  photo_url?: string | null;
  rating?: number;
  wallet_balance?: number;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthLoading: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isAuthLoading: true,
      setAuth: (user, session) => set({ user, session }),
      setProfile: (profile) => set({ profile }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      refreshProfile: async () => {
        const userId = get().user?.id;
        if (!userId) return null;
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          if (error || !data) return null;
          const profile = data as UserProfile;
          set({ profile });
          return profile;
        } catch {
          return null;
        }
      },
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch {
          // Sign out from Supabase best-effort; always clear local state
        }
        set({ user: null, session: null, profile: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
      }),
    }
  )
);
