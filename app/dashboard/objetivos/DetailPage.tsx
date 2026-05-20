"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "~/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  deleteObjective,
  getObjectiveById,
  updateObjective,
} from "~/services/objectivesService";
import {
  createProgressEntry,
  deleteProgressEntry,
  listProgressEntries,
} from "~/services/objectiveProgressService";
import type { ObjectiveProgressEntryRow, ObjectiveRow } from "~/types/alabastro";
import { OBJECTIVE_KIND_LABELS, OBJECTIVE_STATUS_LABELS } from "~/lib/alabastroLabels";
import {
  OBJECTIVE_STATUS_STYLES,
  formatObjectiveAmount,
  objectiveProgressPercent,
  objectiveRemaining,
} from "~/lib/objectiveUtils";
import { STAT_TINT } from "~/lib/statCardStyles";
import { cn, formatDateOnly } from "~/lib/utils";
import {
  ObjectiveFormDialog,
  type ObjectiveFormValues,
} from "~/dashboard/objetivos/ObjectiveFormDialog";
import { objectiveToForm, parseObjectiveForm } from "~/dashboard/objetivos/parseObjectiveForm";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ObjetivoDetailPage() {
  const { objectiveId } = useParams();
  const [objective, setObjective] = useState<ObjectiveRow | null>(null);
  const [entries, setEntries] = useState<ObjectiveProgressEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ObjectiveFormValues | null>(null);
  const [progressForm, setProgressForm] = useState({
    amount: "",
    description: "",
    occurred_on: todayISODate(),
  });

  const load = useCallback(async () => {
    if (!objectiveId) return;
    setLoading(true);
    const [objRes, entriesRes] = await Promise.all([
      getObjectiveById(objectiveId),
      listProgressEntries(objectiveId),
    ]);
    if (objRes.error) toast.error(objRes.error.message);
    if (entriesRes.error) toast.error(entriesRes.error.message);
    setObjective(objRes.data);
    setEntries(entriesRes.data);
    setLoading(false);
  }, [objectiveId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProgress = async () => {
    if (!objective) return;
    const amount = Number(progressForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Indica un monto de avance mayor a 0");
      return;
    }
    if (!progressForm.occurred_on) {
      toast.error("La fecha es obligatoria");
      return;
    }
    setSavingProgress(true);
    const { entry, objective: updated, error } = await createProgressEntry({
      objective_id: objective.id,
      amount,
      description: progressForm.description || null,
      occurred_on: progressForm.occurred_on,
    });
    setSavingProgress(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (entry) setEntries((prev) => [entry, ...prev]);
    if (updated) setObjective(updated);
    setProgressForm({ amount: "", description: "", occurred_on: todayISODate() });
    toast.success("Avance registrado");
  };

  const removeEntry = async (entry: ObjectiveProgressEntryRow) => {
    if (!objective || !confirm("¿Eliminar este registro de avance?")) return;
    const { objective: updated, error } = await deleteProgressEntry(entry.id, objective.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    if (updated) setObjective(updated);
    toast.success("Registro eliminado");
  };

  const saveEdit = async () => {
    if (!objective || !form) return;
    const parsed = parseObjectiveForm(form);
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }
    const { data, error } = await updateObjective(objective.id, parsed.payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setObjective(data);
    toast.success("Objetivo actualizado");
    setEditOpen(false);
  };

  const remove = async () => {
    if (!objective || !confirm(`¿Eliminar «${objective.title}»?`)) return;
    const { error } = await deleteObjective(objective.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Objetivo eliminado");
    window.location.href = "/objetivos";
  };

  if (loading) {
    return <p className="text-muted-foreground">Cargando…</p>;
  }

  if (!objective) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Objetivo no encontrado.</p>
        <Button variant="outline" asChild>
          <Link to="/objetivos">Volver a objetivos</Link>
        </Button>
      </div>
    );
  }

  const pct = objectiveProgressPercent(objective);
  const remaining = objectiveRemaining(objective);
  const statusStyle = OBJECTIVE_STATUS_STYLES[objective.status];

  return (
    <div className="w-full space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground" asChild>
        <Link to="/objetivos">
          <ArrowLeft className="size-4" />
          Volver a objetivos
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{objective.title}</h1>
            <Badge variant="outline">{OBJECTIVE_KIND_LABELS[objective.objective_kind]}</Badge>
            <Badge variant="outline" className={cn("border", statusStyle.badge)}>
              {OBJECTIVE_STATUS_LABELS[objective.status]}
            </Badge>
          </div>
          {objective.description && (
            <p className="text-muted-foreground text-sm max-w-2xl">{objective.description}</p>
          )}
          {objective.deadline_on && (
            <p className="text-xs text-muted-foreground">
              Fecha límite: {formatDateOnly(objective.deadline_on)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" className="gap-1" onClick={() => {
            setForm(objectiveToForm(objective));
            setEditOpen(true);
          }}>
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button variant="destructive" className="gap-1" onClick={() => void remove()}>
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Progreso hacia la meta</CardTitle>
            {objective.target_number != null && (
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {formatObjectiveAmount(Number(objective.current_progress), objective.objective_kind, objective.unit_label)}{" "}
                / {formatObjectiveAmount(Number(objective.target_number), objective.objective_kind, objective.unit_label)}
                {pct != null && ` (${pct}%)`}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {objective.target_number != null ? (
            <>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct !== null && pct >= 100 ? "bg-emerald-500" : "bg-accent-blue"
                  )}
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>
              {remaining != null && remaining > 0 && (
                <p className="text-sm text-muted-foreground">
                  Faltan {formatObjectiveAmount(remaining, objective.objective_kind, objective.unit_label)} para llegar a la meta
                </p>
              )}
              {pct === 100 && (
                <p className="text-sm font-medium text-emerald-700">¡Meta alcanzada!</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Este objetivo no tiene meta numérica definida.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Progreso actual"
          value={formatObjectiveAmount(Number(objective.current_progress), objective.objective_kind, objective.unit_label)}
          className={STAT_TINT.amber}
          valueClassName="text-accent-blue dark:text-[#e8c9a8]"
        />
        <KpiCard
          label="Meta"
          value={
            objective.target_number != null
              ? formatObjectiveAmount(Number(objective.target_number), objective.objective_kind, objective.unit_label)
              : "—"
          }
          className={STAT_TINT.card}
        />
        <KpiCard
          label="Restante"
          value={
            remaining != null
              ? formatObjectiveAmount(remaining, objective.objective_kind, objective.unit_label)
              : "—"
          }
          className={STAT_TINT.emerald}
        />
        <KpiCard
          label="% completado"
          value={pct != null ? `${pct}%` : "—"}
          className={STAT_TINT.sky}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrar avance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="prog-amount">
                Monto del avance <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prog-amount"
                inputMode="decimal"
                placeholder="Ej. 50"
                value={progressForm.amount}
                onChange={(e) => setProgressForm((f) => ({ ...f, amount: e.target.value }))}
              />
              {objective.unit_label && (
                <p className="text-xs text-muted-foreground">Unidad: {objective.unit_label}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prog-date">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prog-date"
                type="date"
                value={progressForm.occurred_on}
                onChange={(e) => setProgressForm((f) => ({ ...f, occurred_on: e.target.value }))}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="prog-desc">Descripción</Label>
              <Textarea
                id="prog-desc"
                rows={2}
                placeholder="Ej. Adelanto de compra, entrega parcial…"
                value={progressForm.description}
                onChange={(e) => setProgressForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              className="bg-accent-blue text-white hover:bg-accent-blue/90"
              disabled={savingProgress}
              onClick={() => void saveProgress()}
            >
              {savingProgress ? "Guardando…" : "Registrar avance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de avances ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aún no hay avances registrados. Cada registro suma al progreso total del objetivo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateOnly(entry.occurred_on)}
                    </TableCell>
                    <TableCell className="max-w-[280px] text-sm">
                      {entry.description?.trim() || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-emerald-700">
                      +{" "}
                      {formatObjectiveAmount(
                        Number(entry.amount),
                        objective.objective_kind,
                        objective.unit_label
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => void removeEntry(entry)}
                        aria-label="Eliminar registro"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {form && editOpen && (
        <ObjectiveFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          editing
          form={form}
          setForm={(updater) =>
            setForm((prev) => {
              if (!prev) return prev;
              return typeof updater === "function" ? updater(prev) : updater;
            })
          }
          onSave={() => void saveEdit()}
        />
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={cn("border", className)}>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn("mt-1 text-lg font-bold tabular-nums text-foreground", valueClassName)}>{value}</p>
      </CardContent>
    </Card>
  );
}
