import supabase from "~/utils/supabase";
import type { StaffMemberRow } from "~/types/alabastro";

export async function getStaffMemberByAuthUserId(
  authUserId: string
): Promise<{ data: StaffMemberRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: (data as StaffMemberRow | null) ?? null, error: null };
}

export async function findStaffMemberByEmail(
  email: string
): Promise<{ data: StaffMemberRow | null; error: Error | null }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { data: null, error: null };
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .ilike("email", normalized)
    .is("auth_user_id", null)
    .limit(1)
    .maybeSingle();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: (data as StaffMemberRow | null) ?? null, error: null };
}

/** Asocia un usuario Auth con una ficha de Personal (1:1). */
export async function linkAuthUserToStaffMember(
  staffMemberId: string,
  authUserId: string
): Promise<{ data: StaffMemberRow | null; error: Error | null }> {
  const { error: clearErr } = await supabase
    .from("staff_members")
    .update({ auth_user_id: null })
    .eq("auth_user_id", authUserId);
  if (clearErr) return { data: null, error: new Error(clearErr.message) };

  const { data, error } = await supabase
    .from("staff_members")
    .update({ auth_user_id: authUserId })
    .eq("id", staffMemberId)
    .select("*")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as StaffMemberRow, error: null };
}

export async function unlinkAuthUserFromStaffMember(
  staffMemberId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("staff_members")
    .update({ auth_user_id: null })
    .eq("id", staffMemberId);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
