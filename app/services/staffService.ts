import supabase from "~/utils/supabase";
import { suggestAvatarColorId, isAvatarColorPresetId } from "~/lib/avatarUi";
import { STAFF_CARGOS } from "~/lib/alabastroLabels";
import type { StaffCargo, StaffMemberRow } from "~/types/alabastro";

function normalizeAvatarColor(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return isAvatarColorPresetId(value) ? value : null;
}

function normalizeCargo(value: string | null | undefined): StaffCargo | null {
  const v = value?.trim();
  if (!v) return null;
  return STAFF_CARGOS.includes(v as StaffCargo) ? (v as StaffCargo) : null;
}

export async function listStaffMembers(): Promise<{ data: StaffMemberRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .order("name", { ascending: true });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as StaffMemberRow[], error: null };
}

export async function createStaffMember(
  row: Pick<StaffMemberRow, "name"> &
    Partial<Pick<StaffMemberRow, "phone" | "email" | "cargo" | "avatar_color" | "avatar_url">>
): Promise<{ data: StaffMemberRow | null; error: Error | null }> {
  const name = row.name.trim();
  const { data, error } = await supabase
    .from("staff_members")
    .insert({
      name,
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      cargo: normalizeCargo(row.cargo),
      avatar_color: normalizeAvatarColor(row.avatar_color) ?? suggestAvatarColorId(name),
      avatar_url: row.avatar_url?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as StaffMemberRow, error: null };
}

export async function updateStaffMember(
  id: string,
  row: Partial<Pick<StaffMemberRow, "name" | "phone" | "email" | "cargo" | "avatar_color" | "avatar_url">>
): Promise<{ data: StaffMemberRow | null; error: Error | null }> {
  const patch: Record<string, unknown> = {};
  if (row.name != null) patch.name = row.name.trim();
  if (row.phone !== undefined) patch.phone = row.phone?.trim() || null;
  if (row.email !== undefined) patch.email = row.email?.trim() || null;
  if (row.cargo !== undefined) patch.cargo = normalizeCargo(row.cargo);
  if (row.avatar_color !== undefined) patch.avatar_color = normalizeAvatarColor(row.avatar_color);
  if (row.avatar_url !== undefined) patch.avatar_url = row.avatar_url?.trim() || null;
  const { data, error } = await supabase.from("staff_members").update(patch).eq("id", id).select("*").single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as StaffMemberRow, error: null };
}

export async function deleteStaffMember(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("staff_members").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
