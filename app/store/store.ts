// stores/userStore.ts
import { create } from 'zustand';
import { User } from '../types/user';


interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  updateUser: (id: number, updatedData: Partial<User>) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user }),
  updateUser: (id, updatedData) => set((state) => ({
    user: state.user && state.user.id === id ? { ...state.user, ...updatedData } : state.user,
  })),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
}));

export default useUserStore;