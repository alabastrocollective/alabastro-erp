"use client";

import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { useDashboardThemeStore } from "~/store/dashboardThemeStore";

/** Envuelve contenido + panel derecho; el menú lateral queda fuera (siempre claro). */
export function DashboardThemeShell({ children }: { children: ReactNode }) {
  const theme = useDashboardThemeStore((s) => s.theme);

  return (
    <div
      className={cn(
        "dashboard-panel flex min-h-svh min-w-0 flex-1 flex-col bg-background text-foreground lg:flex-row",
        theme === "dark" && "dark"
      )}
    >
      {children}
    </div>
  );
}
