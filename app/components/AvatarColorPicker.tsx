"use client";

import { AVATAR_COLOR_PRESETS, type AvatarColorPresetId } from "~/lib/avatarUi";
import { cn } from "~/lib/utils";

export function AvatarColorPicker({
  value,
  onChange,
  seedForSuggestion,
}: {
  value: AvatarColorPresetId | "";
  onChange: (id: AvatarColorPresetId) => void;
  seedForSuggestion?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVATAR_COLOR_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.label}
          onClick={() => onChange(preset.id)}
          className={cn(
            "size-9 rounded-full border-2 transition-transform hover:scale-105",
            preset.className,
            value === preset.id ? "border-foreground ring-2 ring-offset-2 ring-foreground/30" : "border-transparent"
          )}
          aria-label={preset.label}
          aria-pressed={value === preset.id}
        />
      ))}
      {!value && seedForSuggestion && (
        <p className="w-full text-xs text-muted-foreground">
          Si no eliges color, se asignará uno automático según el nombre.
        </p>
      )}
    </div>
  );
}
