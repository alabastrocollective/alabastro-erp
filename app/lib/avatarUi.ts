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

export function resolveAvatarColorId(
  colorId: string | null | undefined,
  fallbackSeed: string
): AvatarColorPresetId {
  if (colorId && colorId in PRESET_BY_ID) return colorId as AvatarColorPresetId;
  return suggestAvatarColorId(fallbackSeed);
}

export function avatarColorClassFromId(
  colorId: string | null | undefined,
  fallbackSeed: string
): string {
  return PRESET_BY_ID[resolveAvatarColorId(colorId, fallbackSeed)].className;
}

/** Estilos de pill/tag para responsable (visible aunque el avatar sea foto). */
export const AVATAR_TAG_CLASS: Record<AvatarColorPresetId, string> = {
  accent:
    "border-accent-blue/45 bg-accent-blue/12 text-primary-blue dark:border-accent-blue/50 dark:bg-accent-blue/18 dark:text-[#e8c9a8]",
  sky: "border-sky-300/80 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-200",
  violet:
    "border-violet-300/80 bg-violet-50 text-violet-900 dark:border-violet-500/40 dark:bg-violet-950/50 dark:text-violet-200",
  emerald:
    "border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-200",
  amber:
    "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-200",
  rose: "border-rose-300/80 bg-rose-50 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-200",
  indigo:
    "border-indigo-300/80 bg-indigo-50 text-indigo-900 dark:border-indigo-500/40 dark:bg-indigo-950/50 dark:text-indigo-200",
  teal: "border-teal-300/80 bg-teal-50 text-teal-900 dark:border-teal-500/40 dark:bg-teal-950/50 dark:text-teal-200",
};

export function avatarTagClassFromId(
  colorId: string | null | undefined,
  fallbackSeed: string
): string {
  return AVATAR_TAG_CLASS[resolveAvatarColorId(colorId, fallbackSeed)];
}

export function isAvatarColorPresetId(value: string): value is AvatarColorPresetId {
  return value in PRESET_BY_ID;
}
