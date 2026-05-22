"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { ObjectiveKind, ObjectiveStatus } from "~/types/alabastro";
import { OBJECTIVE_KIND_LABELS, OBJECTIVE_STATUS_LABELS } from "~/lib/alabastroLabels";

const KINDS: ObjectiveKind[] = ["equipo", "proyectos", "ingresos", "personalizado"];
const STATUSES: ObjectiveStatus[] = ["pendiente", "en_curso", "completado", "cancelado"];

export interface ObjectiveFormValues {
  title: string;
  description: string;
  objective_kind: ObjectiveKind;
  target_number: string;
  current_progress: string;
  unit_label: string;
  deadline_on: string;
  status: ObjectiveStatus;
}

interface ObjectiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: ObjectiveFormValues;
  setForm: React.Dispatch<React.SetStateAction<ObjectiveFormValues>>;
  onSave: () => void;
  saving?: boolean;
}

export function ObjectiveFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  onSave,
  saving = false,
}: ObjectiveFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar objetivo" : "Nuevo objetivo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="o-title">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="o-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Comprar micrófono, 4 proyectos en Q2"
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.objective_kind}
                onValueChange={(v) => setForm((f) => ({ ...f, objective_kind: v as ObjectiveKind }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {OBJECTIVE_KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as ObjectiveStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OBJECTIVE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="o-purpose">Propósito / descripción</Label>
            <Textarea
              id="o-purpose"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Para qué es este objetivo"
            />
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Define la meta numérica y el avance actual. La unidad puede ser USD, proyectos, unidades, etc.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="o-target">Meta</Label>
                <Input
                  id="o-target"
                  inputMode="decimal"
                  value={form.target_number}
                  onChange={(e) => setForm((f) => ({ ...f, target_number: e.target.value }))}
                  placeholder="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-prog">Progreso actual</Label>
                <Input
                  id="o-prog"
                  inputMode="decimal"
                  value={form.current_progress}
                  onChange={(e) => setForm((f) => ({ ...f, current_progress: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="o-unit">Unidad</Label>
                <Input
                  id="o-unit"
                  value={form.unit_label}
                  onChange={(e) => setForm((f) => ({ ...f, unit_label: e.target.value }))}
                  placeholder="USD, proyectos…"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="o-dead">Fecha límite</Label>
              <Input
                id="o-dead"
                type="date"
                value={form.deadline_on}
                onChange={(e) => setForm((f) => ({ ...f, deadline_on: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-accent-blue text-white hover:bg-accent-blue/90"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear objetivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
