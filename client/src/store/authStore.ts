import { create } from 'zustand';
import type { User } from '@/types';
import { api, setAuthUserId } from '@/lib/api';

export const COLOR_PALETTE = [
  '#4A90E2', '#E25C5C', '#50C878', '#F5A623', '#9B59B6',
  '#1ABC9C', '#E67E22', '#E91E63', '#3498DB', '#607D8B',
];

interface AuthStore {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  register: (data: Omit<User, 'id'>) => Promise<User>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  isLoggedIn: false,

  login: async (email: string) => {
    const user = await api.login(email);
    setAuthUserId(user.id);
    set({ currentUser: user, isLoggedIn: true });
  },

  logout: () => {
    setAuthUserId(null);
    set({ currentUser: null, isLoggedIn: false });
  },

  register: async (data: Omit<User, 'id'>) => {
    const user = await api.register(data);
    setAuthUserId(user.id);
    set({ currentUser: user, isLoggedIn: true });
    return user;
  },
}));
