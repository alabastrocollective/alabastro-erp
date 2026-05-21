import supabase from "~/utils/supabase";

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  } catch (error) {
    return { data: null, error: { message: "Error de conexión con el servidor" } };
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Auth session missing") || msg.includes("AuthSessionMissingError")) {
      return { success: true };
    }
    return { success: true };
  }
};

export const getCurrentSessionUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { user: null, error };
  return { user: data.session?.user ?? null, error: null };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
};

export const changePasswordWithCurrent = async (
  email: string,
  currentPassword: string,
  newPassword: string
) => {
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: currentPassword,
  });
  if (signErr) {
    return { data: null, error: { message: "La contraseña actual no es correcta" } };
  }
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
};

export async function updateUserProfile(metadata: {
  full_name?: string;
  avatar_url?: string | null;
  avatar_color?: string | null;
  staff_member_id?: string | null;
}) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...(metadata.full_name !== undefined ? { full_name: metadata.full_name.trim() } : {}),
      ...(metadata.avatar_url !== undefined ? { avatar_url: metadata.avatar_url } : {}),
      ...(metadata.avatar_color !== undefined ? { avatar_color: metadata.avatar_color } : {}),
      ...(metadata.staff_member_id !== undefined
        ? { staff_member_id: metadata.staff_member_id }
        : {}),
    },
  });
  if (error) return { user: null, error: new Error(error.message) };
  return { user: data.user, error: null };
}
