import supabase from "~/utils/supabase";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadAvatarFile(
  path: string,
  file: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  if (!file.type.startsWith("image/")) {
    return { publicUrl: null, error: new Error("Solo se permiten imágenes") };
  }
  if (file.size > MAX_BYTES) {
    return { publicUrl: null, error: new Error("La imagen debe pesar menos de 2 MB") };
  }

  const ext = extFromFile(file);
  const fullPath = `${path}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fullPath, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) return { publicUrl: null, error: new Error(uploadError.message) };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  const url = data.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
  return { publicUrl: url, error: null };
}

export function staffAvatarPath(staffId: string): string {
  return `staff/${staffId}`;
}

export function userAvatarPath(userId: string): string {
  return `users/${userId}`;
}
