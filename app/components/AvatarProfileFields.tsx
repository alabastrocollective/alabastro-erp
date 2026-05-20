"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { AvatarColorPicker } from "~/components/AvatarColorPicker";
import { PersonAvatar } from "~/components/PersonAvatar";
import type { AvatarColorPresetId } from "~/lib/avatarUi";
import { isAvatarColorPresetId } from "~/lib/avatarUi";

export function AvatarProfileFields({
  displayName,
  avatarColor,
  avatarUrl,
  previewUrl,
  onColorChange,
  onPickFile,
  onClearPhoto,
}: {
  displayName: string;
  avatarColor: AvatarColorPresetId | "";
  avatarUrl: string | null;
  previewUrl: string | null;
  onColorChange: (id: AvatarColorPresetId) => void;
  onPickFile: (file: File) => void;
  onClearPhoto: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shownUrl = previewUrl || avatarUrl;
  const color = avatarColor && isAvatarColorPresetId(avatarColor) ? avatarColor : "";

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
      <Label className="text-sm font-medium">Avatar</Label>
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar
          name={displayName || "?"}
          avatarColor={color || null}
          avatarUrl={shownUrl}
          size="xl"
        />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickFile(file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="size-4" />
            Subir foto
          </Button>
          {shownUrl && (
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={onClearPhoto}>
              <X className="size-4" />
              Quitar foto
            </Button>
          )}
          <p className="text-xs text-muted-foreground max-w-[220px]">
            JPG, PNG o WebP. Máx. 2 MB. Si no hay foto, se muestran las iniciales con el color elegido.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Color del avatar (tareas y listados)</Label>
        <AvatarColorPicker
          value={color}
          onChange={onColorChange}
          seedForSuggestion={displayName}
        />
      </div>
    </div>
  );
}
