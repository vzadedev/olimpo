import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@gymrank/types';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'gymrank-auth' },
  ),
);
