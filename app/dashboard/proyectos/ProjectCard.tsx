"use client";

import { Link } from "react-router";
import { Calendar, ChevronRight, LayoutGrid, Music, Pencil, Trash2, Video } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { ProjectRow } from "~/types/alabastro";
import type { ProjectTaskSummary } from "~/services/projectTasksService";
import { PACKAGE_CATEGORY_LABELS, PROJECT_STATUS_LABELS } from "~/lib/alabastroLabels";
import {
  PACKAGE_CATEGORY_UI,
  PROJECT_STATUS_UI,
  avatarColorClass,
  daysUntilDelivery,
  deliveryBadgeClass,
  getInitials,
} from "~/lib/projectUi";
import { cn, formatDateOnly, formatUsd } from "~/lib/utils";

export function ProjectCard({
  project: p,
  taskSummary,
  onEdit,
  onDelete,
}: {
  project: ProjectRow;
  taskSummary?: ProjectTaskSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusUi = PROJECT_STATUS_UI[p.status];
  const category = p.service_packages?.category;
  const categoryUi = category ? PACKAGE_CATEGORY_UI[category] : null;
  const delivery = daysUntilDelivery(p.expected_delivery_on);
  const total = taskSummary?.total ?? 0;
  const done = taskSummary?.terminado ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const clientName = p.clients?.name ?? "Sin cliente";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-accent-blue/30 hover:shadow-lg"
      )}
    >
      <div className={cn("absolute left-0 top-0 h-full w-1", statusUi.accent)} aria-hidden />
      <Link
        to={`/proyectos/${p.id}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        aria-label={`Abrir tablero de ${p.title}`}
      />

      <div className="relative z-10 flex flex-1 flex-col p-5 pointer-events-none">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-inner",
              avatarColorClass(clientName)
            )}
          >
            {getInitials(clientName)}
          </div>
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="font-semibold leading-snug text-foreground line-clamp-2">{p.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">{clientName}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("text-xs font-medium border", statusUi.badge)}>
            {PROJECT_STATUS_LABELS[p.status]}
          </Badge>
          {p.service_packages && categoryUi && (
            <Badge variant="outline" className={cn("text-xs gap-1 border", categoryUi.badge)}>
              {category === "musica" ? (
                <Music className="size-3 shrink-0" />
              ) : (
                <Video className="size-3 shrink-0" />
              )}
              {p.service_packages.name}
            </Badge>
          )}
        </div>

        {total > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso del tablero</span>
              <span className="font-medium tabular-nums text-foreground">
                {done}/{total} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent-blue transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{formatUsd(p.agreed_price_usd)}</span>
          {p.expected_delivery_on && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatDateOnly(p.expected_delivery_on)}
            </span>
          )}
        </div>

        {delivery && (
          <Badge
            variant="outline"
            className={cn("mt-2 w-fit text-[11px] pointer-events-none", deliveryBadgeClass(delivery.tone))}
          >
            {delivery.label}
          </Badge>
        )}

        <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-accent-blue">
          <LayoutGrid className="size-3.5" />
          Abrir tablero
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-1 pointer-events-auto">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-full bg-card/90 shadow-sm backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Editar proyecto"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-full bg-card/90 shadow-sm backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Eliminar proyecto"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </article>
  );
}
