import supabase from "~/utils/supabase";
import type { ProjectRow, ProjectStatus } from "~/types/alabastro";

export async function getProjectById(id: string): Promise<{ data: ProjectRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), service_packages(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: (data as ProjectRow | null) ?? null, error: null };
}

export async function listProjects(): Promise<{ data: ProjectRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), service_packages(*)")
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ProjectRow[], error: null };
}

export async function createProject(row: {
  client_id: string;
  service_package_id: string | null;
  title: string;
  agreed_price_usd: number;
  deposit_percent?: number;
  status?: ProjectRow["status"];
  starting_point?: ProjectRow["starting_point"];
  notes?: string | null;
  expected_delivery_on?: string | null;
}): Promise<{ data: ProjectRow | null; error: Error | null }> {
  const insert = {
    client_id: row.client_id,
    service_package_id: row.service_package_id,
    title: row.title.trim(),
    agreed_price_usd: row.agreed_price_usd,
    deposit_percent: row.deposit_percent ?? 30,
    status: row.status ?? "borrador",
    starting_point: row.starting_point ?? "otro",
    notes: row.notes?.trim() || null,
    expected_delivery_on: row.expected_delivery_on || null,
  };
  const { data, error } = await supabase.from("projects").insert(insert).select("*, clients(*), service_packages(*)").single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ProjectRow, error: null };
}

export async function updateProject(
  id: string,
  patch: Partial<{
    client_id: string;
    service_package_id: string | null;
    title: string;
    agreed_price_usd: number;
    deposit_percent: number;
    status: ProjectStatus;
    starting_point: ProjectRow["starting_point"];
    notes: string | null;
    expected_delivery_on: string | null;
    delivered_at: string | null;
  }>
): Promise<{ data: ProjectRow | null; error: Error | null }> {
  const body: Record<string, unknown> = { ...patch };
  if (patch.title != null) body.title = patch.title.trim();
  if (patch.notes !== undefined) body.notes = patch.notes?.trim() || null;
  if (patch.status === "entregado") {
    body.delivered_at =
      patch.delivered_at !== undefined ? patch.delivered_at : new Date().toISOString();
  }
  const { data, error } = await supabase.from("projects").update(body).eq("id", id).select("*, clients(*), service_packages(*)").single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ProjectRow, error: null };
}

export async function deleteProject(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
