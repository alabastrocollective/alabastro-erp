import type { ObjectiveKind, ObjectiveRow, ObjectiveStatus } from "~/types/alabastro";
import { formatUsd } from "~/lib/utils";

export type ObjectiveFilter = "todas" | ObjectiveStatus;

export function objectiveProgressPercent(obj: ObjectiveRow): number | null {
  if (obj.target_number == null || obj.target_number <= 0) return null;
  const pct = (Number(obj.current_progress) / Number(obj.target_number)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function objectiveRemaining(obj: ObjectiveRow): number | null {
  if (obj.target_number == null) return null;
  return Math.max(0, Number(obj.target_number) - Number(obj.current_progress));
}

export function formatObjectiveAmount(value: number, kind: ObjectiveKind, unitLabel: string | null): string {
  const unit = unitLabel?.trim().toLowerCase();
  if (kind === "ingresos" || unit === "usd" || unit === "us$") {
    return formatUsd(value);
  }
  const suffix = unitLabel?.trim() ? ` ${unitLabel.trim()}` : "";
  return `${value.toLocaleString("es")}${suffix}`;
}

export const OBJECTIVE_STATUS_STYLES: Record<
  ObjectiveStatus,
  { badge: string; card: string; tab: string }
> = {
  pendiente: {
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    card: "bg-amber-50/50",
    tab: "data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  },
  en_curso: {
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
    card: "bg-emerald-50/50",
    tab: "data-[active=true]:bg-emerald-600 data-[active=true]:text-white",
  },
  completado: {
    badge: "bg-sky-100 text-sky-900 border-sky-200",
    card: "bg-sky-50/50",
    tab: "data-[active=true]:bg-sky-600 data-[active=true]:text-white",
  },
  cancelado: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    card: "bg-slate-50/50",
    tab: "data-[active=true]:bg-slate-500 data-[active=true]:text-white",
  },
};

export const OBJECTIVE_KIND_HEADER: Record<ObjectiveKind, string> = {
  equipo: "from-amber-100 via-amber-50 to-orange-50",
  proyectos: "from-sky-100 via-sky-50 to-indigo-50",
  ingresos: "from-emerald-100 via-emerald-50 to-teal-50",
  personalizado: "from-slate-100 via-slate-50 to-zinc-50",
};

export const OBJECTIVE_KIND_EMOJI: Record<ObjectiveKind, string> = {
  equipo: "🎛️",
  proyectos: "🎬",
  ingresos: "💵",
  personalizado: "🎯",
};
