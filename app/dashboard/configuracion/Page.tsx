"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore, getAppRole, type User } from "~/store/authStore";
import { changePasswordWithCurrent, updateUserProfile } from "~/services/authService";
import { uploadAvatarFile, userAvatarPath } from "~/services/avatarStorageService";
import { AvatarProfileFields } from "~/components/AvatarProfileFields";
import { StaffAccountLinkSection } from "~/components/StaffAccountLinkSection";
import { DashboardThemeToggle } from "~/components/DashboardThemeToggle";
import { useDashboardThemeStore } from "~/store/dashboardThemeStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  isAvatarColorPresetId,
  suggestAvatarColorId,
  type AvatarColorPresetId,
} from "~/lib/avatarUi";

type UserMeta = {
  full_name?: string;
  avatar_url?: string;
  avatar_color?: string;
  role?: string;
};

export default function ConfiguracionPage() {
  const { user, login } = useAuthStore();
  const dashboardTheme = useDashboardThemeStore((s) => s.theme);
  const meta = (user?.user_metadata ?? {}) as UserMeta;

  const [fullName, setFullName] = useState(meta.full_name ?? "");
  const [avatarColor, setAvatarColor] = useState<AvatarColorPresetId | "">(
    meta.avatar_color && isAvatarColorPresetId(meta.avatar_color) ? meta.avatar_color : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(meta.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const m = (user?.user_metadata ?? {}) as UserMeta;
    setFullName(m.full_name ?? "");
    setAvatarColor(m.avatar_color && isAvatarColorPresetId(m.avatar_color) ? m.avatar_color : "");
    setAvatarUrl(m.avatar_url ?? "");
    setAvatarPreview(null);
    setPendingAvatarFile(null);
  }, [user?.id]);

  const submitProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      let nextUrl = avatarUrl || null;
      const colorId = avatarColor || suggestAvatarColorId(fullName || user.email || "U");

      if (pendingAvatarFile) {
        const up = await uploadAvatarFile(userAvatarPath(user.id), pendingAvatarFile);
        if (up.error) {
          toast.error(up.error.message);
          return;
        }
        nextUrl = up.publicUrl;
      }

      const { user: updated, error } = await updateUserProfile({
        full_name: fullName,
        avatar_color: colorId,
        avatar_url: nextUrl,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (updated) {
        login({
          id: updated.id,
          email: updated.email ?? user.email,
          user_metadata: updated.user_metadata as User["user_metadata"],
          created_at: user.created_at,
          updated_at: user.updated_at,
        });
      }
      setAvatarUrl(nextUrl ?? "");
      setPendingAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Perfil actualizado");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newPw.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPw !== newPw2) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await changePasswordWithCurrent(user.email, currentPw, newPw);
      if (error) {
        toast.error(error.message ?? "No se pudo actualizar");
        return;
      }
      toast.success("Contraseña actualizada");
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-sm">Tu cuenta, vínculo con Personal, avatar y contraseña.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Apariencia del panel</CardTitle>
            <CardDescription>
              Modo oscuro para el contenido central y la barra derecha. El menú lateral se mantiene igual.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Actual:{" "}
              <span className="font-medium text-foreground">
                {dashboardTheme === "dark" ? "Oscuro" : "Claro"}
              </span>
            </p>
            <DashboardThemeToggle showLabel />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>Se verifica la contraseña actual antes de guardar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void submitPassword(e)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="pw-current">Contraseña actual</Label>
                <Input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label htmlFor="pw-new">Nueva contraseña</Label>
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pw-new2">Confirmar nueva</Label>
                <Input
                  id="pw-new2"
                  type="password"
                  autoComplete="new-password"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={savingPw}>
                {savingPw ? "Guardando…" : "Actualizar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuenta y Personal</CardTitle>
          <CardDescription>
            Vincula tu usuario de acceso con tu ficha del equipo para comentar en tareas con tu nombre y avatar de
            Personal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffAccountLinkSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>
            Foto y color de la barra lateral (usuario Auth). El color en tarjetas del tablero sigue la ficha de
            Personal si estás vinculado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
            <AvatarProfileFields
              displayName={fullName || user?.email || "Usuario"}
              avatarColor={avatarColor}
              avatarUrl={avatarUrl}
              previewUrl={avatarPreview}
              onColorChange={setAvatarColor}
              onPickFile={(file) => {
                setPendingAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
              onClearPhoto={() => {
                setPendingAvatarFile(null);
                setAvatarPreview(null);
                setAvatarUrl("");
              }}
            />
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cfg-name">Nombre para mostrar</Label>
                <Input
                  id="cfg-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Correo: {user?.email ?? "—"} · Rol: {user ? getAppRole(user) : "—"}
              </p>
              <Button type="button" disabled={savingProfile} onClick={() => void submitProfile()}>
                {savingProfile ? "Guardando…" : "Guardar perfil"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
