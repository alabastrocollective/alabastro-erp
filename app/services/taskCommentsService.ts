import supabase from "~/utils/supabase";
import type { ProjectTaskCommentRow } from "~/types/alabastro";

const COMMENT_SELECT = "*, staff_members(id, name, cargo, avatar_color, avatar_url)";

export async function listTaskComments(
  taskId: string
): Promise<{ data: ProjectTaskCommentRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("project_task_comments")
    .select(COMMENT_SELECT)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ProjectTaskCommentRow[], error: null };
}

export async function createTaskComment(
  taskId: string,
  staffMemberId: string,
  body: string
): Promise<{ data: ProjectTaskCommentRow | null; error: Error | null }> {
  const text = body.trim();
  if (!text) return { data: null, error: new Error("El comentario no puede estar vacío") };

  const { data, error } = await supabase
    .from("project_task_comments")
    .insert({
      task_id: taskId,
      staff_member_id: staffMemberId,
      body: text,
    })
    .select(COMMENT_SELECT)
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ProjectTaskCommentRow, error: null };
}

export async function deleteTaskComment(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("project_task_comments").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
