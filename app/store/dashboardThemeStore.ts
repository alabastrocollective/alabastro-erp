import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardTheme = "light" | "dark";

interface DashboardThemeState {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
}

export const useDashboardThemeStore = create<DashboardThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "light" ? "dark" : "light" }),
    }),
    { name: "alabastro-dashboard-theme" }
  )
);
