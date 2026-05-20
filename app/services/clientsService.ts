import supabase from "~/utils/supabase";
import type { ClientRow } from "~/types/alabastro";

export async function listClients(): Promise<{ data: ClientRow[]; error: Error | null }> {
  const { data, error } = await supabase.from("clients").select("*").order("name", { ascending: true });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as ClientRow[], error: null };
}

export async function createClient(
  row: Pick<ClientRow, "name"> & Partial<Pick<ClientRow, "phone" | "email" | "notes">>
): Promise<{ data: ClientRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: row.name.trim(),
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      notes: row.notes?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ClientRow, error: null };
}

export async function updateClient(
  id: string,
  row: Partial<Pick<ClientRow, "name" | "phone" | "email" | "notes">>
): Promise<{ data: ClientRow | null; error: Error | null }> {
  const patch: Record<string, unknown> = {};
  if (row.name != null) patch.name = row.name.trim();
  if (row.phone !== undefined) patch.phone = row.phone?.trim() || null;
  if (row.email !== undefined) patch.email = row.email?.trim() || null;
  if (row.notes !== undefined) patch.notes = row.notes?.trim() || null;
  const { data, error } = await supabase.from("clients").update(patch).eq("id", id).select("*").single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ClientRow, error: null };
}

export async function deleteClient(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
