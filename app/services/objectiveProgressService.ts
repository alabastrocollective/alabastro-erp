import supabase from "~/utils/supabase";
import type { ObjectiveProgressEntryRow, ObjectiveRow } from "~/types/alabastro";

async function syncObjectiveProgressFromEntries(objectiveId: string): Promise<{ total: number; error: Error | null }> {
  const { data, error } = await supabase
    .from("objective_progress_entries")
    .select("amount")
    .eq("objective_id", objectiveId);
  if (error) return { total: 0, error: new Error(error.message) };
  const total = (data ?? []).reduce((sum, row) => sum + Number((row as { amount: number }).amount), 0);
  const { error: updErr } = await supabase
    .from("objectives")
    .update({ current_progress: total })
    .eq("id", objectiveId);
  if (updErr) return { total: 0, error: new Error(updErr.message) };
  return { total, error: null };
}

export async function listProgressEntries(
  objectiveId: string
): Promise<{ data: ObjectiveProgressEntryRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("objective_progress_entries")
    .select("*")
    .eq("objective_id", objectiveId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ObjectiveProgressEntryRow[], error: null };
}

export async function createProgressEntry(row: {
  objective_id: string;
  amount: number;
  description?: string | null;
  occurred_on: string;
}): Promise<{ entry: ObjectiveProgressEntryRow | null; objective: ObjectiveRow | null; error: Error | null }> {
  const { data: entry, error } = await supabase
    .from("objective_progress_entries")
    .insert({
      objective_id: row.objective_id,
      amount: row.amount,
      description: row.description?.trim() || null,
      occurred_on: row.occurred_on,
    })
    .select("*")
    .single();
  if (error) return { entry: null, objective: null, error: new Error(error.message) };

  const sync = await syncObjectiveProgressFromEntries(row.objective_id);
  if (sync.error) return { entry: entry as ObjectiveProgressEntryRow, objective: null, error: sync.error };

  const { data: objective, error: objErr } = await supabase
    .from("objectives")
    .select("*")
    .eq("id", row.objective_id)
    .single();
  if (objErr) return { entry: entry as ObjectiveProgressEntryRow, objective: null, error: new Error(objErr.message) };

  return {
    entry: entry as ObjectiveProgressEntryRow,
    objective: objective as ObjectiveRow,
    error: null,
  };
}

export async function deleteProgressEntry(
  entryId: string,
  objectiveId: string
): Promise<{ objective: ObjectiveRow | null; error: Error | null }> {
  const { error } = await supabase.from("objective_progress_entries").delete().eq("id", entryId);
  if (error) return { objective: null, error: new Error(error.message) };

  const sync = await syncObjectiveProgressFromEntries(objectiveId);
  if (sync.error) return { objective: null, error: sync.error };

  const { data: objective, error: objErr } = await supabase
    .from("objectives")
    .select("*")
    .eq("id", objectiveId)
    .single();
  if (objErr) return { objective: null, error: new Error(objErr.message) };
  return { objective: objective as ObjectiveRow, error: null };
}
