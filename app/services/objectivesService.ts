import supabase from "~/utils/supabase";
import type { ObjectiveRow, ObjectiveKind, ObjectiveStatus } from "~/types/alabastro";

export async function getObjectiveById(id: string): Promise<{ data: ObjectiveRow | null; error: Error | null }> {
  const { data, error } = await supabase.from("objectives").select("*").eq("id", id).maybeSingle();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: (data as ObjectiveRow | null) ?? null, error: null };
}

export async function listObjectives(): Promise<{ data: ObjectiveRow[]; error: Error | null }> {
  const { data, error } = await supabase.from("objectives").select("*").order("deadline_on", { ascending: true, nullsFirst: false });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ObjectiveRow[], error: null };
}

export async function createObjective(row: {
  title: string;
  description?: string | null;
  objective_kind?: ObjectiveKind;
  target_number?: number | null;
  current_progress?: number;
  unit_label?: string | null;
  deadline_on?: string | null;
  status?: ObjectiveStatus;
}): Promise<{ data: ObjectiveRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("objectives")
    .insert({
      title: row.title.trim(),
      description: row.description?.trim() || null,
      objective_kind: row.objective_kind ?? "personalizado",
      target_number: row.target_number ?? null,
      current_progress: row.current_progress ?? 0,
      unit_label: row.unit_label?.trim() || null,
      deadline_on: row.deadline_on || null,
      status: row.status ?? "pendiente",
    })
    .select("*")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ObjectiveRow, error: null };
}

export async function updateObjective(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    objective_kind: ObjectiveKind;
    target_number: number | null;
    current_progress: number;
    unit_label: string | null;
    deadline_on: string | null;
    status: ObjectiveStatus;
  }>
): Promise<{ data: ObjectiveRow | null; error: Error | null }> {
  const body: Record<string, unknown> = { ...patch };
  if (patch.title != null) body.title = patch.title.trim();
  if (patch.description !== undefined) body.description = patch.description?.trim() || null;
  if (patch.unit_label !== undefined) body.unit_label = patch.unit_label?.trim() || null;
  const { data, error } = await supabase.from("objectives").update(body).eq("id", id).select("*").single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ObjectiveRow, error: null };
}

export async function deleteObjective(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("objectives").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
