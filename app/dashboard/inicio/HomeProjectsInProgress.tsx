"use client";

import { Link } from "react-router";
import { Calendar, ChevronRight, FolderKanban, Music, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { ProjectInProgressItem } from "~/services/dashboardService";
import { PROJECT_STATUS_LABELS } from "~/lib/alabastroLabels";
import {
  PACKAGE_CATEGORY_UI,
  PROJECT_STATUS_UI,
  avatarColorClass,
  daysUntilDelivery,
  deliveryBadgeClass,
  getInitials,
} from "~/lib/projectUi";
import { cn } from "~/lib/utils";

export function HomeProjectsInProgress({
  items,
  loading,
}: {
  items: ProjectInProgressItem[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="size-4 text-accent-blue" />
            Proyectos en curso
          </CardTitle>
          <CardDescription>
            Presupuesto aceptado, producción o revisión · progreso según tareas del tablero
          </CardDescription>
        </div>
        {!loading && items.length > 0 && (
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link to="/proyectos">Ver todos</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay proyectos en curso en este momento.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <ProjectProgressRow key={item.project.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectProgressRow({ item }: { item: ProjectInProgressItem }) {
  const { project: p, tasksTotal, tasksDone, progressPct } = item;
  const statusUi = PROJECT_STATUS_UI[p.status];
  const category = p.service_packages?.category;
  const categoryUi = category ? PACKAGE_CATEGORY_UI[category] : null;
  const delivery = daysUntilDelivery(p.expected_delivery_on);
  const clientName = p.clients?.name ?? "Sin cliente";

  return (
    <li>
      <Link
        to={`/proyectos/${p.id}`}
        className={cn(
          "group flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 p-4 transition-all sm:flex-row sm:items-center",
          "hover:border-accent-blue/35 hover:bg-card hover:shadow-md"
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
              avatarColorClass(clientName)
            )}
          >
            {getInitials(clientName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-foreground group-hover:text-accent-blue transition-colors">
              {p.title}
            </p>
            <p className="text-sm text-muted-foreground truncate">{clientName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={cn("text-[10px] border", statusUi.badge)}>
                {PROJECT_STATUS_LABELS[p.status]}
              </Badge>
              {p.service_packages && categoryUi && (
                <Badge variant="outline" className={cn("text-[10px] gap-0.5 border", categoryUi.badge)}>
                  {category === "musica" ? <Music className="size-2.5" /> : <Video className="size-2.5" />}
                  {p.service_packages.name}
                </Badge>
              )}
              {delivery && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] gap-0.5", deliveryBadgeClass(delivery.tone))}
                >
                  <Calendar className="size-2.5" />
                  {delivery.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 sm:w-48 lg:w-56">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progreso tablero</span>
            <span className="font-semibold tabular-nums text-accent-blue">
              {tasksTotal > 0 ? `${progressPct}%` : "—"}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressPct >= 100 ? "bg-emerald-500" : "bg-accent-blue"
              )}
              style={{ width: `${tasksTotal > 0 ? progressPct : 0}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
            {tasksTotal > 0 ? (
              <>
                {tasksDone} de {tasksTotal} tareas terminadas
              </>
            ) : (
              "Sin tareas en el tablero"
            )}
          </p>
        </div>

        <ChevronRight className="hidden size-5 shrink-0 text-muted-foreground group-hover:text-accent-blue sm:block" />
      </Link>
    </li>
  );
}
