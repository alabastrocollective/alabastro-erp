"use client";

import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { useAuthStore } from "~/store/authStore";
import { getCurrentSessionUser } from "~/services/authService";
import { AppSidebar } from "~/components/ui/app-sidebar";
import { SidebarProvider, useSidebar } from "~/components/ui/sidebar";
import { getPrimaryColor } from "~/lib/erpBranding";
import { FullPageLoader } from "~/components/FullPageLoader";
import { Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DashboardRightAside } from "~/dashboard/DashboardRightAside";

function MobileMenuButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpenMobile(true)}>
      <Menu className="h-6 w-6" />
    </Button>
  );
}

export default function DashboardLayout() {
  const { user, isAuthenticated, hasHydrated, login } = useAuthStore();
  const [checkingSession, setCheckingSession] = useState(!hasHydrated);
  const location = useLocation();
  const isWideContent =
    location.pathname === "/" || /^\/proyectos/.test(location.pathname) || /^\/objetivos/.test(location.pathname);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      setCheckingSession(false);
      return;
    }
    getCurrentSessionUser()
      .then(({ user: sessionUser }) => {
        if (sessionUser) login(sessionUser as any);
      })
      .finally(() => setCheckingSession(false));
  }, [hasHydrated, isAuthenticated]);

  if (!hasHydrated || checkingSession) {
    return <FullPageLoader label="Verificando sesión…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider style={{
      "--sidebar-width": "17rem",
      "--sidebar-background": getPrimaryColor()
    } as React.CSSProperties}>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col py-10 text-primary-blue sm:py-12",
            isWideContent ? "px-3 sm:px-5" : "px-4 sm:px-8"
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full flex-1 flex-col gap-4",
              isWideContent ? "max-w-none" : "max-w-5xl"
            )}
          >
            <div className="flex w-full items-center gap-2">
              <div className="shrink-0 lg:hidden">
                <MobileMenuButton />
              </div>
              <div className="min-w-0 flex-1" aria-hidden />
            </div>
            <Outlet />
          </div>
        </main>
        <DashboardRightAside />
      </div>
    </SidebarProvider>
  );
}
