import supabase from "~/utils/supabase";
import type { DefaultMusicTaskTemplate } from "~/lib/musicPackageTasks";
import type { ProjectTaskRow, ProjectTaskWithProject, TaskStatus } from "~/types/alabastro";

const TASK_SELECT = "*, staff_members(id, name, cargo, avatar_color, avatar_url)";
const BACKLOG_SELECT =
  "*, staff_members(id, name, cargo, avatar_color, avatar_url), projects(id, title, status, clients(name))";

export async function listTasksByProject(
  projectId: string
): Promise<{ data: ProjectTaskRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select(TASK_SELECT)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ProjectTaskRow[], error: null };
}

async function nextSortOrder(projectId: string, status: TaskStatus): Promise<number> {
  const { data: existing } = await supabase
    .from("project_tasks")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("status", status)
    .order("sort_order", { ascending: false })
    .limit(1);
  return existing && existing.length > 0 ? Number((existing[0] as { sort_order: number }).sort_order) + 1 : 0;
}

export async function createTask(row: {
  project_id: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  assigned_staff_id?: string | null;
  due_on?: string | null;
}): Promise<{ data: ProjectTaskRow | null; error: Error | null }> {
  const status = row.status ?? "pendiente";
  const nextOrder = await nextSortOrder(row.project_id, status);

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({
      project_id: row.project_id,
      title: row.title.trim(),
      description: row.description?.trim() || null,
      status,
      sort_order: nextOrder,
      assigned_staff_id: row.assigned_staff_id || null,
      due_on: row.due_on || null,
    })
    .select(TASK_SELECT)
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ProjectTaskRow, error: null };
}

/** Tareas iniciales en pendiente (paquetes de música). */
export async function createDefaultMusicPackageTasks(
  projectId: string,
  templates: DefaultMusicTaskTemplate[]
): Promise<{ data: ProjectTaskRow[]; error: Error | null }> {
  if (templates.length === 0) return { data: [], error: null };

  const rows = templates.map((t, index) => ({
    project_id: projectId,
    title: t.title,
    description: t.description,
    status: "pendiente" as const,
    sort_order: index,
    assigned_staff_id: null,
    due_on: null,
  }));

  const { data, error } = await supabase.from("project_tasks").insert(rows).select(TASK_SELECT);
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ProjectTaskRow[], error: null };
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    sort_order: number;
    assigned_staff_id: string | null;
    due_on: string | null;
  }>
): Promise<{ data: ProjectTaskRow | null; error: Error | null }> {
  const body: Record<string, unknown> = { ...patch };
  if (patch.title != null) body.title = patch.title.trim();
  if (patch.description !== undefined) body.description = patch.description?.trim() || null;
  if (patch.assigned_staff_id !== undefined) body.assigned_staff_id = patch.assigned_staff_id || null;
  if (patch.due_on !== undefined) body.due_on = patch.due_on || null;
  const { data, error } = await supabase.from("project_tasks").update(body).eq("id", id).select(TASK_SELECT).single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ProjectTaskRow, error: null };
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newSortOrder: number
): Promise<{ data: ProjectTaskRow | null; error: Error | null }> {
  return updateTask(taskId, { status: newStatus, sort_order: newSortOrder });
}

export async function deleteTask(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export interface ProjectTaskSummary {
  total: number;
  terminado: number;
}

/** Resumen de tareas por proyecto (para tarjetas del listado). */
export async function getTaskSummariesByProjectIds(
  projectIds: string[]
): Promise<{ data: Record<string, ProjectTaskSummary>; error: Error | null }> {
  if (projectIds.length === 0) return { data: {}, error: null };
  const { data, error } = await supabase
    .from("project_tasks")
    .select("project_id, status")
    .in("project_id", projectIds);
  if (error) return { data: {}, error: new Error(error.message) };

  const map: Record<string, ProjectTaskSummary> = {};
  for (const id of projectIds) map[id] = { total: 0, terminado: 0 };
  for (const row of data ?? []) {
    const r = row as { project_id: string; status: string };
    const entry = map[r.project_id];
    if (!entry) continue;
    entry.total += 1;
    if (r.status === "terminado") entry.terminado += 1;
  }
  return { data: map, error: null };
}

/** Todas las tareas (backlog global) con proyecto y responsable. */
export async function listAllTasks(): Promise<{ data: ProjectTaskWithProject[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select(BACKLOG_SELECT)
    .order("status", { ascending: true })
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ProjectTaskWithProject[], error: null };
}
