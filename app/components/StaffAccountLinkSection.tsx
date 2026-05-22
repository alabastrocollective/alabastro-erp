"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { AssigneeBadge } from "~/components/AssigneeBadge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useCurrentStaffMember } from "~/hooks/useCurrentStaffMember";
import { getCurrentSessionUser, updateUserProfile } from "~/services/authService";
import {
  linkAuthUserToStaffMember,
  unlinkAuthUserFromStaffMember,
} from "~/services/staffAuthLinkService";
import { listStaffMembers } from "~/services/staffService";
import { useAuthStore, type User } from "~/store/authStore";
import { STAFF_CARGO_LABELS } from "~/lib/alabastroLabels";
import { useSubmitLock } from "~/hooks/useSubmitLock";
import type { StaffMemberRow } from "~/types/alabastro";

const NONE = "__none__";

export function StaffAccountLinkSection() {
  const { user, login } = useAuthStore();
  const { staffMember, suggestedByEmail, loading, reload } = useCurrentStaffMember();
  const [allStaff, setAllStaff] = useState<StaffMemberRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>(NONE);
  const { isSubmitting: saving, run: runSave } = useSubmitLock();

  useEffect(() => {
    void listStaffMembers().then(({ data }) => setAllStaff(data));
  }, []);

  useEffect(() => {
    if (staffMember) setSelectedId(staffMember.id);
    else if (suggestedByEmail) setSelectedId(suggestedByEmail.id);
    else setSelectedId(NONE);
  }, [staffMember?.id, suggestedByEmail?.id]);

  const saveLink = () =>
    void runSave(async () => {
    if (!user?.id) return;
      if (selectedId === NONE) {
        if (staffMember) {
          const { error } = await unlinkAuthUserFromStaffMember(staffMember.id);
          if (error) {
            toast.error(error.message);
            return;
          }
          await updateUserProfile({ staff_member_id: null });
          toast.success("Vinculación eliminada");
        }
      } else {
        const { data, error } = await linkAuthUserToStaffMember(selectedId, user.id);
        if (error) {
          toast.error(error.message);
          return;
        }
        await updateUserProfile({ staff_member_id: data?.id ?? selectedId });
        toast.success(`Vinculado con ${data?.name ?? "Personal"}`);
      }
      const { user: sessionUser } = await getCurrentSessionUser();
      if (sessionUser) {
        login({
          id: sessionUser.id,
          email: sessionUser.email ?? user.email,
          user_metadata: sessionUser.user_metadata as User["user_metadata"],
          created_at: user.created_at,
          updated_at: user.updated_at,
        });
      }
      await reload();
    });

  const linkableStaff = allStaff.filter(
    (s) => !s.auth_user_id || s.auth_user_id === user?.id
  );

  return (
    <div className="space-y-4">
      {staffMember ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
          <AssigneeBadge
            name={staffMember.name}
            avatarColor={staffMember.avatar_color}
            avatarUrl={staffMember.avatar_url}
            size="sm"
          />
          <p className="text-sm text-muted-foreground">
            {staffMember.cargo ? STAFF_CARGO_LABELS[staffMember.cargo] : "Sin cargo"} · Los comentarios en
            tareas salen con este nombre y avatar.
          </p>
        </div>
      ) : (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4 shrink-0 mt-0.5" />
          Sin vincular: no podrás firmar comentarios en el tablero hasta elegir tu ficha en Personal.
        </p>
      )}

      {suggestedByEmail && !staffMember && (
        <p className="text-xs text-muted-foreground">
          Sugerencia por correo: <span className="font-medium text-foreground">{suggestedByEmail.name}</span>
        </p>
      )}

      <div className="grid gap-2 max-w-md">
        <Label htmlFor="staff-link">Persona en Personal</Label>
        <Select value={selectedId} onValueChange={setSelectedId} disabled={loading}>
          <SelectTrigger id="staff-link">
            <SelectValue placeholder={loading ? "Cargando…" : "Seleccionar"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sin vincular</SelectItem>
            {linkableStaff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.cargo ? ` · ${STAFF_CARGO_LABELS[s.cargo]}` : ""}
                {s.email ? ` (${s.email})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Cada usuario Auth solo puede vincularse a una ficha. Crea o edita personas en{" "}
          <span className="font-medium">Personal</span> si no apareces en la lista.
        </p>
      </div>

      <Button type="button" disabled={saving || loading} onClick={saveLink}>
        {saving ? "Guardando…" : "Guardar vinculación"}
      </Button>
    </div>
  );
}
