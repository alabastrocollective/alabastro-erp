"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { createObjective, listObjectives, updateObjective } from "~/services/objectivesService";
import type { ObjectiveRow, ObjectiveStatus } from "~/types/alabastro";
import { OBJECTIVE_STATUS_LABELS } from "~/lib/alabastroLabels";
import type { ObjectiveFilter } from "~/lib/objectiveUtils";
import { cn } from "~/lib/utils";
import { ObjectiveCard } from "~/dashboard/objetivos/ObjectiveCard";
import {
  ObjectiveFormDialog,
  type ObjectiveFormValues,
} from "~/dashboard/objetivos/ObjectiveFormDialog";
import { emptyObjectiveForm, parseObjectiveForm } from "~/dashboard/objetivos/parseObjectiveForm";

const FILTERS: { id: ObjectiveFilter; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "en_curso", label: "En curso" },
  { id: "pendiente", label: "Pendientes" },
  { id: "completado", label: "Completados" },
  { id: "cancelado", label: "Cancelados" },
];

export default function ObjetivosPage() {
  const [rows, setRows] = useState<ObjectiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ObjectiveFilter>("todas");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ObjectiveRow | null>(null);
  const [form, setForm] = useState<ObjectiveFormValues>(emptyObjectiveForm);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listObjectives();
    if (error) toast.error(error.message);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pendiente = rows.filter((r) => r.status === "pendiente").length;
    const enCurso = rows.filter((r) => r.status === "en_curso").length;
    const completado = rows.filter((r) => r.status === "completado").length;
    return { total, pendiente, enCurso, completado };
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "todas") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyObjectiveForm());
    setOpen(true);
  };

  const save = async () => {
    const parsed = parseObjectiveForm(form);
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }
    if (editing) {
      const { error } = await updateObjective(editing.id, parsed.payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Objetivo actualizado");
    } else {
      const { error } = await createObjective(parsed.payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Objetivo creado");
    }
    setOpen(false);
    void load();
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
            <Target className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-blue">Objetivos</h1>
            <p className="text-sm text-muted-foreground">
              Metas del collective: equipo, proyectos, ingresos y más.
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shrink-0 bg-accent-blue text-white hover:bg-accent-blue/90"
        >
          <Plus className="size-4" />
          Nuevo objetivo
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Total" value={stats.total} className="bg-card" />
        <SummaryStat label="En curso" value={stats.enCurso} className="bg-emerald-50/80 border-emerald-100" />
        <SummaryStat label="Pendientes" value={stats.pendiente} className="bg-amber-50/80 border-amber-100" />
        <SummaryStat label="Completados" value={stats.completado} className="bg-sky-50/80 border-sky-100" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.id
                ? "border-accent-blue bg-accent-blue text-white"
                : "border-border bg-card text-foreground hover:bg-muted/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">Cargando objetivos…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              {filter === "todas"
                ? "Aún no hay objetivos. Crea el primero para empezar a medir el progreso."
                : `No hay objetivos ${OBJECTIVE_STATUS_LABELS[filter as ObjectiveStatus]?.toLowerCase() ?? ""}.`}
            </p>
            {filter === "todas" && (
              <Button onClick={openCreate} className="mt-4 gap-2 bg-accent-blue text-white">
                <Plus className="size-4" />
                Nuevo objetivo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <ObjectiveCard key={o.id} objective={o} />
          ))}
        </div>
      )}

      <ObjectiveFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={!!editing}
        form={form}
        setForm={setForm}
        onSave={() => void save()}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card className={cn("border", className)}>
      <CardContent className="flex flex-col items-center justify-center py-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
