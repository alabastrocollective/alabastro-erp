"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  createStaffMember,
  deleteStaffMember,
  listStaffMembers,
  updateStaffMember,
} from "~/services/staffService";
import { AvatarProfileFields } from "~/components/AvatarProfileFields";
import { PersonAvatar } from "~/components/PersonAvatar";
import { uploadAvatarFile, staffAvatarPath } from "~/services/avatarStorageService";
import { STAFF_CARGO_LABELS, STAFF_CARGOS } from "~/lib/alabastroLabels";
import {
  isAvatarColorPresetId,
  suggestAvatarColorId,
  type AvatarColorPresetId,
} from "~/lib/avatarUi";
import type { StaffCargo, StaffMemberRow } from "~/types/alabastro";

type StaffForm = {
  name: string;
  phone: string;
  email: string;
  cargo: "" | StaffCargo;
  avatar_color: AvatarColorPresetId | "";
  avatar_url: string;
};

const emptyForm = (): StaffForm => ({
  name: "",
  phone: "",
  email: "",
  cargo: "",
  avatar_color: "",
  avatar_url: "",
});

function isStaffCargo(value: string): value is StaffCargo {
  return STAFF_CARGOS.includes(value as StaffCargo);
}

export default function PersonalPage() {
  const [rows, setRows] = useState<StaffMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [editing, setEditing] = useState<StaffMemberRow | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listStaffMembers();
    if (error) toast.error(error.message);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetAvatarDraft = () => {
    setAvatarPreview(null);
    setPendingAvatarFile(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    resetAvatarDraft();
    setOpen(true);
  };

  const openEdit = (row: StaffMemberRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      phone: row.phone ?? "",
      email: row.email ?? "",
      cargo: row.cargo && isStaffCargo(row.cargo) ? row.cargo : "",
      avatar_color: row.avatar_color && isAvatarColorPresetId(row.avatar_color) ? row.avatar_color : "",
      avatar_url: row.avatar_url ?? "",
    });
    resetAvatarDraft();
    setOpen(true);
  };

  const save = async () => {
    if (savingRef.current) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.cargo || !isStaffCargo(form.cargo)) {
      toast.error("Selecciona un cargo");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const colorId = form.avatar_color || suggestAvatarColorId(form.name);
      let staffId = editing?.id;
      let avatarUrl = form.avatar_url || null;

      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        cargo: form.cargo,
        avatar_color: colorId,
        avatar_url: avatarUrl,
      };

      if (editing) {
        const { error } = await updateStaffMember(editing.id, payload);
        if (error) {
          toast.error(error.message);
          return;
        }
        staffId = editing.id;
      } else {
        const { data, error } = await createStaffMember(payload);
        if (error) {
          toast.error(error.message);
          return;
        }
        staffId = data?.id;
      }

      if (pendingAvatarFile && staffId) {
        const up = await uploadAvatarFile(staffAvatarPath(staffId), pendingAvatarFile);
        if (up.error) {
          toast.error(up.error.message);
          return;
        }
        avatarUrl = up.publicUrl;
        const { error: urlErr } = await updateStaffMember(staffId, { avatar_url: avatarUrl });
        if (urlErr) {
          toast.error(urlErr.message);
          return;
        }
      }

      toast.success(editing ? "Persona actualizada" : "Persona registrada");
      setOpen(false);
      resetAvatarDraft();
      void load();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const onDialogOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      savingRef.current = false;
      setSaving(false);
      resetAvatarDraft();
    }
  };

  const remove = async (row: StaffMemberRow) => {
    if (!confirm(`¿Eliminar a ${row.name} del personal?`)) return;
    const { error } = await deleteStaffMember(row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registro eliminado");
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
            <UserRound className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Personal</h1>
            <p className="text-muted-foreground text-sm">
              Socios, productores y trabajadores del collective.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0 bg-accent-blue text-white hover:bg-accent-blue/90">
          <Plus className="size-4" />
          Nueva persona
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipo ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              Aún no hay personas registradas. Agrega socios, productores o colaboradores.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <PersonAvatar
                          name={row.name}
                          avatarColor={row.avatar_color}
                          avatarUrl={row.avatar_url}
                          size="sm"
                        />
                        {row.name}
                      </span>
                    </TableCell>
                    <TableCell>{row.phone || "—"}</TableCell>
                    <TableCell>{row.email || "—"}</TableCell>
                    <TableCell>
                      {row.cargo ? STAFF_CARGO_LABELS[row.cargo] : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(row)}
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void remove(row)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar persona" : "Nueva persona"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <AvatarProfileFields
              displayName={form.name}
              avatarColor={form.avatar_color}
              avatarUrl={form.avatar_url}
              previewUrl={avatarPreview}
              onColorChange={(id) => setForm((f) => ({ ...f, avatar_color: id }))}
              onPickFile={(file) => {
                setPendingAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
              onClearPhoto={() => {
                setPendingAvatarFile(null);
                setAvatarPreview(null);
                setForm((f) => ({ ...f, avatar_url: "" }));
              }}
            />
            <div className="grid gap-2">
              <Label htmlFor="s-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-phone">Teléfono</Label>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-email">Correo</Label>
              <Input
                id="s-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>
                Cargo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.cargo || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, cargo: v as StaffCargo }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_CARGOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {STAFF_CARGO_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-accent-blue text-white hover:bg-accent-blue/90"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
