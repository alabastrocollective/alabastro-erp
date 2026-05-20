"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Plus, FolderKanban, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { listClients } from "~/services/clientsService";
import { getDefaultTasksForMusicPackage } from "~/lib/musicPackageTasks";
import { createDefaultMusicPackageTasks, getTaskSummariesByProjectIds } from "~/services/projectTasksService";
import { ProjectCard } from "~/dashboard/proyectos/ProjectCard";
import { ProyectosSubNav } from "~/dashboard/proyectos/ProyectosSubNav";
import type { ProjectTaskSummary } from "~/services/projectTasksService";
import { createProject, deleteProject, listProjects, updateProject } from "~/services/projectsService";
import { effectivePackagePriceUsd, listServicePackages } from "~/services/servicePackagesService";
import type { ClientRow, ProjectRow, ProjectStatus, ServicePackageRow, StartingPoint } from "~/types/alabastro";
import { PACKAGE_CATEGORY_LABELS, PROJECT_STATUS_LABELS, STARTING_POINT_LABELS } from "~/lib/alabastroLabels";
import { cn, formatUsd } from "~/lib/utils";

const STATUSES: ProjectStatus[] = [
  "borrador",
  "presupuesto",
  "en_produccion",
  "revision",
  "entregado",
  "cancelado",
];

const STARTING: StartingPoint[] = ["maqueta", "letra_solo", "desde_cero", "otro"];

export default function ProyectosPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [taskSummaries, setTaskSummaries] = useState<Record<string, ProjectTaskSummary>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "todos">("todos");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [packages, setPackages] = useState<ServicePackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState({
    client_id: "",
    service_package_id: "__none__",
    title: "",
    agreed_price_usd: "",
    deposit_percent: "30",
    status: "borrador" as ProjectStatus,
    starting_point: "otro" as StartingPoint,
    notes: "",
    expected_delivery_on: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c, pk] = await Promise.all([listProjects(), listClients(), listServicePackages()]);
    if (p.error) toast.error(p.error.message);
    if (c.error) toast.error(c.error.message);
    if (pk.error) toast.error(pk.error.message);
    setProjects(p.data);
    setClients(c.data);
    setPackages(pk.data);
    const ids = p.data.map((x) => x.id);
    const sum = await getTaskSummariesByProjectIds(ids);
    if (sum.error) toast.error(sum.error.message);
    setTaskSummaries(sum.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const packageById = useMemo(() => new Map(packages.map((x) => [x.id, x])), [packages]);

  const stats = useMemo(() => {
    const active = new Set<ProjectStatus>(["presupuesto", "en_produccion", "revision"]);
    return {
      total: projects.length,
      enCurso: projects.filter((p) => active.has(p.status)).length,
      entregados: projects.filter((p) => p.status === "entregado").length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        p.title,
        p.clients?.name,
        p.service_packages?.name,
        PROJECT_STATUS_LABELS[p.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      client_id: clients[0]?.id ?? "",
      service_package_id: "__none__",
      title: "",
      agreed_price_usd: "",
      deposit_percent: "30",
      status: "borrador",
      starting_point: "otro",
      notes: "",
      expected_delivery_on: "",
    });
    setOpen(true);
  };

  const openEdit = (row: ProjectRow) => {
    setEditing(row);
    setForm({
      client_id: row.client_id,
      service_package_id: row.service_package_id ?? "__none__",
      title: row.title,
      agreed_price_usd: String(row.agreed_price_usd),
      deposit_percent: String(row.deposit_percent),
      status: row.status,
      starting_point: row.starting_point,
      notes: row.notes ?? "",
      expected_delivery_on: row.expected_delivery_on ?? "",
    });
    setOpen(true);
  };

  const onPackageChange = (value: string) => {
    setForm((f) => {
      const next = { ...f, service_package_id: value };
      if (value && value !== "__none__") {
        const pkg = packageById.get(value);
        if (pkg) {
          next.agreed_price_usd = String(effectivePackagePriceUsd(pkg));
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (savingRef.current) return;

    if (!form.client_id) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!form.title.trim()) {
      toast.error("El título del proyecto es obligatorio");
      return;
    }
    const price = Number(form.agreed_price_usd);
    if (Number.isNaN(price) || price < 0) {
      toast.error("Precio acordado inválido (USD)");
      return;
    }
    const dep = Number(form.deposit_percent);
    if (Number.isNaN(dep) || dep < 0 || dep > 100) {
      toast.error("Porcentaje de adelanto entre 0 y 100");
      return;
    }
    const pkgId = form.service_package_id === "__none__" ? null : form.service_package_id;

    savingRef.current = true;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await updateProject(editing.id, {
          client_id: form.client_id,
          service_package_id: pkgId,
          title: form.title,
          agreed_price_usd: price,
          deposit_percent: dep,
          status: form.status,
          starting_point: form.starting_point,
          notes: form.notes || null,
          expected_delivery_on: form.expected_delivery_on || null,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Proyecto actualizado");
      } else {
        const { data: created, error } = await createProject({
          client_id: form.client_id,
          service_package_id: pkgId,
          title: form.title,
          agreed_price_usd: price,
          deposit_percent: dep,
          status: form.status,
          starting_point: form.starting_point,
          notes: form.notes || null,
          expected_delivery_on: form.expected_delivery_on || null,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (created) {
          const pkg =
            created.service_packages ??
            (pkgId ? packageById.get(pkgId) : undefined);
          const templates = getDefaultTasksForMusicPackage(pkg ?? null);
          if (templates.length > 0) {
            const seed = await createDefaultMusicPackageTasks(created.id, templates);
            if (seed.error) {
              toast.error(`Proyecto creado, pero falló cargar tareas: ${seed.error.message}`);
            } else {
              toast.success(`Proyecto creado con ${seed.data.length} tareas en el tablero`);
            }
          } else {
            toast.success("Proyecto creado");
          }
        } else {
          toast.success("Proyecto creado");
        }
      }
      setOpen(false);
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
    }
  };

  const remove = async (row: ProjectRow) => {
    if (!confirm(`¿Eliminar el proyecto «${row.title}»?`)) return;
    const { error } = await deleteProject(row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Proyecto eliminado");
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-blue/15 text-accent-blue">
            <FolderKanban className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-blue">Proyectos</h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Vista general de producción. Abre cualquier tarjeta para gestionar el tablero Kanban.
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shrink-0 bg-accent-blue text-white hover:bg-accent-blue/90"
          disabled={clients.length === 0}
        >
          <Plus className="size-4" />
          Nuevo proyecto
        </Button>
      </div>

      <ProyectosSubNav active="list" />

      {!loading && projects.length > 0 && (
        <div className="grid gap-3 grid-cols-3 max-w-xl">
          <StatPill label="Total" value={stats.total} />
          <StatPill label="En curso" value={stats.enCurso} accent />
          <StatPill label="Entregados" value={stats.entregados} />
        </div>
      )}

      {clients.length === 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Crea al menos un cliente antes de agregar proyectos.
        </p>
      )}

      {!loading && projects.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 bg-card"
              placeholder="Buscar por título, cliente o paquete…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={statusFilter === "todos"} onClick={() => setStatusFilter("todos")}>
              Todos
            </FilterChip>
            {STATUSES.filter((s) => s !== "cancelado").map((s) => (
              <FilterChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              >
                {PROJECT_STATUS_LABELS[s]}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FolderKanban className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Aún no hay proyectos. Crea uno para empezar a organizar tareas en el tablero.
            </p>
            {clients.length > 0 && (
              <Button onClick={openCreate} className="mt-4 gap-2 bg-accent-blue text-white">
                <Plus className="size-4" />
                Crear primer proyecto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Ningún proyecto coincide con la búsqueda o el filtro.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              taskSummary={taskSummaries[p.id]}
              onEdit={() => openEdit(p)}
              onDelete={() => void remove(p)}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-title">Título (canción / video)</Label>
              <Input id="p-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Paquete (opcional)</Label>
              <Select value={form.service_package_id} onValueChange={onPackageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin paquete del catálogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin paquete / precio manual</SelectItem>
                  {packages.map((pk) => (
                    <SelectItem key={pk.id} value={pk.id}>
                      {PACKAGE_CATEGORY_LABELS[pk.category]} · {pk.name} — promo {formatUsd(pk.price_promo_usd)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Al elegir paquete se rellena el precio con la promo vigente si está activa; puedes ajustarlo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="p-price">Precio acordado (USD)</Label>
                <Input
                  id="p-price"
                  inputMode="decimal"
                  value={form.agreed_price_usd}
                  onChange={(e) => setForm((f) => ({ ...f, agreed_price_usd: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-dep">Adelanto %</Label>
                <Input
                  id="p-dep"
                  inputMode="numeric"
                  value={form.deposit_percent}
                  onChange={(e) => setForm((f) => ({ ...f, deposit_percent: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Punto de partida del cliente</Label>
              <Select
                value={form.starting_point}
                onValueChange={(v) => setForm((f) => ({ ...f, starting_point: v as StartingPoint }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STARTING.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STARTING_POINT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-due">Entrega estimada</Label>
              <Input
                id="p-due"
                type="date"
                value={form.expected_delivery_on}
                onChange={(e) => setForm((f) => ({ ...f, expected_delivery_on: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-notes">Notas</Label>
              <Textarea id="p-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        accent ? "border-accent-blue/25 bg-accent-blue/5" : "border-border bg-card"
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", accent && "text-accent-blue")}>{value}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent-blue bg-accent-blue text-white"
          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
      )}
    >
      {children}
    </button>
  );
}
