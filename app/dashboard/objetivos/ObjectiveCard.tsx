"use client";

import { Link } from "react-router";
import { ArrowRight, Target } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import type { ObjectiveRow } from "~/types/alabastro";
import { OBJECTIVE_KIND_LABELS, OBJECTIVE_STATUS_LABELS } from "~/lib/alabastroLabels";
import {
  OBJECTIVE_KIND_EMOJI,
  OBJECTIVE_KIND_HEADER,
  OBJECTIVE_STATUS_STYLES,
  formatObjectiveAmount,
  objectiveProgressPercent,
  objectiveRemaining,
} from "~/lib/objectiveUtils";
import { cn, formatDateOnly } from "~/lib/utils";

export function ObjectiveCard({ objective: o }: { objective: ObjectiveRow }) {
  const pct = objectiveProgressPercent(o);
  const remaining = objectiveRemaining(o);
  const statusStyle = OBJECTIVE_STATUS_STYLES[o.status];

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div
        className={cn(
          "flex h-28 items-center justify-center bg-gradient-to-br",
          OBJECTIVE_KIND_HEADER[o.objective_kind]
        )}
      >
        <span className="text-5xl" role="img" aria-hidden>
          {OBJECTIVE_KIND_EMOJI[o.objective_kind]}
        </span>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs font-normal">
            {OBJECTIVE_KIND_LABELS[o.objective_kind]}
          </Badge>
          <Badge variant="outline" className={cn("text-xs font-normal border", statusStyle.badge)}>
            {OBJECTIVE_STATUS_LABELS[o.status]}
          </Badge>
        </div>
        <h3 className="font-semibold leading-snug line-clamp-2">{o.title}</h3>
        {o.target_number != null ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium tabular-nums">
                {formatObjectiveAmount(Number(o.current_progress), o.objective_kind, o.unit_label)} /{" "}
                {formatObjectiveAmount(Number(o.target_number), o.objective_kind, o.unit_label)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct !== null && pct >= 100 ? "bg-emerald-500" : "bg-accent-blue"
                )}
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {pct != null ? `${pct}% completado` : "Sin meta numérica"}
              {remaining != null && remaining > 0 && ` · Faltan ${formatObjectiveAmount(remaining, o.objective_kind, o.unit_label)}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Target className="size-3.5 shrink-0" />
            Avance: {formatObjectiveAmount(Number(o.current_progress), o.objective_kind, o.unit_label)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Avance</p>
            <p className="font-semibold text-accent-blue tabular-nums">
              {formatObjectiveAmount(Number(o.current_progress), o.objective_kind, o.unit_label)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Meta</p>
            <p className="font-semibold tabular-nums">
              {o.target_number != null
                ? formatObjectiveAmount(Number(o.target_number), o.objective_kind, o.unit_label)
                : "—"}
            </p>
          </div>
        </div>
        {o.deadline_on && (
          <p className="text-xs text-muted-foreground">
            Límite: {formatDateOnly(o.deadline_on)}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full gap-1" asChild>
          <Link to={`/objetivos/${o.id}`}>
            Ver detalle
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
