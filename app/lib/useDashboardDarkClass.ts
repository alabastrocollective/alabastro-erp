"use client";

import { useDashboardThemeStore } from "~/store/dashboardThemeStore";

/** Clases para portales (dialog, select) que quedan fuera de `.dashboard-panel`. */
export function useDashboardDarkClass(): string {
  const theme = useDashboardThemeStore((s) => s.theme);
  return theme === "dark" ? "dark dashboard-panel" : "";
}
