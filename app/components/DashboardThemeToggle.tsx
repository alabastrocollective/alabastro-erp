"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useDashboardThemeStore } from "~/store/dashboardThemeStore";
import { cn } from "~/lib/utils";

export function DashboardThemeToggle({
  showLabel = false,
  className,
  size = "sm",
}: {
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "icon";
}) {
  const { theme, toggleTheme } = useDashboardThemeStore();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "icon" ? "icon" : "sm"}
      className={cn("gap-2", className)}
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {showLabel && (
        <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
      )}
    </Button>
  );
}
