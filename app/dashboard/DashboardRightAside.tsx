"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  DollarSign,
  ClipboardList,
  FolderKanban,
  Home,
  Settings,
  Target,
  User as UserIcon,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getAppRole, useAuthStore } from "~/store/authStore";
import { PersonAvatar } from "~/components/PersonAvatar";
import { cn } from "~/lib/utils";

const quickLinks: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Inicio", href: "/", icon: Home },
  { title: "Finanzas", href: "/finanzas", icon: DollarSign },
  { title: "Proyectos", href: "/proyectos", icon: FolderKanban },
  { title: "Tareas", href: "/proyectos/tareas", icon: ClipboardList },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Personal", href: "/personal", icon: UserRound },
  { title: "Objetivos", href: "/objetivos", icon: Target },
  { title: "Reportes", href: "/reportes", icon: BarChart3 },
  { title: "Configuración", href: "/configuracion", icon: Settings },
];

function formatJoinedAt(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function roleLabel(role: ReturnType<typeof getAppRole>): string {
  return role === "admin" ? "Admin" : "Gestor";
}

export function DashboardRightAside() {
  const { user } = useAuthStore();
  const location = useLocation();
  const role = getAppRole(user);
  const displayName = user?.user_metadata?.full_name?.trim() || "Usuario";
  const meta = user?.user_metadata as { avatar_url?: string; avatar_color?: string } | undefined;

  return (
    <aside
      className={cn(
        "sticky top-0 z-0 hidden h-svh w-[min(100%,20rem)] shrink-0 flex-col border-l border-border/60 bg-muted/35 backdrop-blur-[2px] sm:w-80 lg:flex"
      )}
    >
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-10 sm:px-5">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Perfil del usuario
          </h2>
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <PersonAvatar
                name={displayName}
                avatarColor={meta?.avatar_color}
                avatarUrl={meta?.avatar_url}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{displayName}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                  {roleLabel(role)}
                </Badge>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ingreso {formatJoinedAt(user?.created_at)}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link to="/configuracion">
                <UserIcon className="size-4 shrink-0" />
                Datos y configuración
              </Link>
            </Button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Accesos rápidos
          </h2>
          <nav className="flex flex-col gap-1 rounded-xl border border-border/80 bg-card p-2 shadow-sm">
            {quickLinks.map((item) => {
              const active =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary-blue/10 font-medium text-primary-blue"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="size-4 shrink-0 opacity-80" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </section>
      </div>
    </aside>
  );
}
