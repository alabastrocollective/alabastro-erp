"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { createClient, deleteClient, listClients, updateClient } from "~/services/clientsService";
import { useSubmitLock } from "~/hooks/useSubmitLock";
import type { ClientRow } from "~/types/alabastro";

const emptyForm = { name: "", phone: "", email: "", notes: "" };

export default function ClientesPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSubmitting: saving, run: runSave, reset: resetSave } = useSubmitLock();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listClients();
    if (error) toast.error(error.message);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: ClientRow) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  };

  const save = () =>
    void runSave(async () => {
      if (!form.name.trim()) {
        toast.error("El nombre es obligatorio");
        return;
      }
      if (editing) {
        const { error } = await updateClient(editing.id, form);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Cliente actualizado");
      } else {
        const { error } = await createClient(form);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Cliente creado");
      }
      setOpen(false);
      void load();
    });

  const onDialogOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetSave();
  };

  const remove = async (c: ClientRow) => {
    if (!confirm(`¿Eliminar a ${c.name}? No podrás si tiene proyectos vinculados.`)) return;
    const { error } = await deleteClient(c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente eliminado");
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Nombre o razón social, contacto y notas.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="size-4" /> Nuevo cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aún no hay clientes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(c)} aria-label="Eliminar">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="c-name">Nombre o razón social</Label>
              <Input id="c-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-phone">Teléfono</Label>
              <Input id="c-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-notes">Notas</Label>
              <Textarea id="c-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onDialogOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
