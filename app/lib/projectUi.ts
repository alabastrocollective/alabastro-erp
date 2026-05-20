import type { ProjectStatus } from "~/types/alabastro";

export const PROJECT_STATUS_UI: Record<
  ProjectStatus,
  { badge: string; accent: string; ring: string }
> = {
  borrador: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "bg-slate-400",
    ring: "ring-slate-200",
  },
  presupuesto: {
    badge: "bg-violet-100 text-violet-800 border-violet-200",
    accent: "bg-violet-500",
    ring: "ring-violet-200",
  },
  en_produccion: {
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    accent: "bg-sky-500",
    ring: "ring-sky-200",
  },
  revision: {
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    accent: "bg-amber-500",
    ring: "ring-amber-200",
  },
  entregado: {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accent: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  cancelado: {
    badge: "bg-red-50 text-red-700 border-red-200",
    accent: "bg-red-400",
    ring: "ring-red-200",
  },
};

export const PACKAGE_CATEGORY_UI: Record<
  "musica" | "video",
  { badge: string; accent: string }
> = {
  musica: {
    badge: "bg-accent-blue/15 text-accent-blue border-accent-blue/25",
    accent: "bg-accent-blue",
  },
  video: {
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    accent: "bg-indigo-500",
  },
};

export const TASK_COLUMN_UI: Record<
  string,
  { column: string; header: string; dot: string }
> = {
  pendiente: {
    column: "bg-slate-50/90 border-slate-200/80",
    header: "text-slate-600",
    dot: "bg-slate-400",
  },
  en_progreso: {
    column: "bg-sky-50/80 border-sky-200/70",
    header: "text-sky-800",
    dot: "bg-sky-500",
  },
  en_revision: {
    column: "bg-amber-50/80 border-amber-200/70",
    header: "text-amber-900",
    dot: "bg-amber-500",
  },
  terminado: {
    column: "bg-emerald-50/80 border-emerald-200/70",
    header: "text-emerald-800",
    dot: "bg-emerald-500",
  },
};

export { getInitials } from "~/lib/avatarUi";
import { avatarColorClassFromId } from "~/lib/avatarUi";

/** Color por nombre (clientes, etc.) cuando no hay color guardado en BD */
export function avatarColorClass(seed: string): string {
  return avatarColorClassFromId(null, seed);
}

export function daysUntilDelivery(isoDate: string | null | undefined): {
  label: string;
  tone: "neutral" | "soon" | "overdue" | "today";
} | null {
  if (!isoDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `Venció hace ${Math.abs(diff)} d`, tone: "overdue" };
  if (diff === 0) return { label: "Entrega hoy", tone: "today" };
  if (diff === 1) return { label: "1 día restante", tone: "soon" };
  if (diff <= 7) return { label: `${diff} días restantes`, tone: "soon" };
  return { label: `${diff} días`, tone: "neutral" };
}

export function deliveryBadgeClass(tone: "neutral" | "soon" | "overdue" | "today"): string {
  switch (tone) {
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200";
    case "today":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "soon":
      return "bg-orange-50 text-orange-800 border-orange-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function isDueOverdue(isoDate: string | null | undefined): boolean {
  const info = daysUntilDelivery(isoDate);
  return info?.tone === "overdue";
}
