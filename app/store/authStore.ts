import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppRole = "admin" | "gestor";

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
  created_at: string;
  updated_at: string;
}

export function getAppRole(user: User | null): AppRole {
  const role = user?.user_metadata?.role;
  if (role === "gestor" || role === "admin") return role;
  if (role === "vendedor") return "gestor";
  return "admin";
}

export function isGestor(user: User | null): boolean {
  return getAppRole(user) === "gestor";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
