/** Paleta fija de colores para avatares (personal y tareas). */
export const AVATAR_COLOR_PRESETS = [
  { id: "accent", label: "Bronce", className: "bg-accent-blue text-white" },
  { id: "sky", label: "Azul", className: "bg-sky-600 text-white" },
  { id: "violet", label: "Violeta", className: "bg-violet-600 text-white" },
  { id: "emerald", label: "Verde", className: "bg-emerald-600 text-white" },
  { id: "amber", label: "Ámbar", className: "bg-amber-600 text-white" },
  { id: "rose", label: "Rosa", className: "bg-rose-600 text-white" },
  { id: "indigo", label: "Índigo", className: "bg-indigo-600 text-white" },
  { id: "teal", label: "Teal", className: "bg-teal-600 text-white" },
] as const;

export type AvatarColorPresetId = (typeof AVATAR_COLOR_PRESETS)[number]["id"];

const PRESET_BY_ID = Object.fromEntries(AVATAR_COLOR_PRESETS.map((p) => [p.id, p])) as Record<
  AvatarColorPresetId,
  (typeof AVATAR_COLOR_PRESETS)[number]
>;

export function getInitials(name: string, max = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Sugiere un color estable a partir del nombre (si no hay color guardado). */
export function suggestAvatarColorId(seed: string): AvatarColorPresetId {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) | 0;
  return AVATAR_COLOR_PRESETS[Math.abs(hash) % AVATAR_COLOR_PRESETS.length].id;
}

export function avatarColorClassFromId(
  colorId: string | null | undefined,
  fallbackSeed: string
): string {
  const id = (colorId && colorId in PRESET_BY_ID ? colorId : suggestAvatarColorId(fallbackSeed)) as AvatarColorPresetId;
  return PRESET_BY_ID[id].className;
}

export function isAvatarColorPresetId(value: string): value is AvatarColorPresetId {
  return value in PRESET_BY_ID;
}
