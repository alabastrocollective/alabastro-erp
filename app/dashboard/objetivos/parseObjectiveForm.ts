import type { ObjectiveFormValues } from "~/dashboard/objetivos/ObjectiveFormDialog";
import type { ObjectiveRow } from "~/types/alabastro";

export const emptyObjectiveForm = (): ObjectiveFormValues => ({
  title: "",
  description: "",
  objective_kind: "personalizado",
  target_number: "",
  current_progress: "0",
  unit_label: "",
  deadline_on: "",
  status: "pendiente",
});

export function objectiveToForm(row: ObjectiveRow): ObjectiveFormValues {
  return {
    title: row.title,
    description: row.description ?? "",
    objective_kind: row.objective_kind,
    target_number: row.target_number != null ? String(row.target_number) : "",
    current_progress: String(row.current_progress),
    unit_label: row.unit_label ?? "",
    deadline_on: row.deadline_on ?? "",
    status: row.status,
  };
}

export function parseObjectiveForm(form: ObjectiveFormValues): {
  ok: true;
  payload: {
    title: string;
    description: string | null;
    objective_kind: ObjectiveFormValues["objective_kind"];
    target_number: number | null;
    current_progress: number;
    unit_label: string | null;
    deadline_on: string | null;
    status: ObjectiveFormValues["status"];
  };
} | { ok: false; message: string } {
  if (!form.title.trim()) {
    return { ok: false, message: "El nombre es obligatorio" };
  }
  const rawTarget = form.target_number.trim();
  let target: number | null = null;
  if (rawTarget !== "") {
    const n = Number(rawTarget);
    if (Number.isNaN(n)) return { ok: false, message: "Meta numérica inválida" };
    target = n;
  }
  const prog = Number(form.current_progress);
  if (Number.isNaN(prog)) return { ok: false, message: "Progreso actual inválido" };
  return {
    ok: true,
    payload: {
      title: form.title.trim(),
      description: form.description.trim() || null,
      objective_kind: form.objective_kind,
      target_number: target,
      current_progress: prog,
      unit_label: form.unit_label.trim() || null,
      deadline_on: form.deadline_on || null,
      status: form.status,
    },
  };
}
