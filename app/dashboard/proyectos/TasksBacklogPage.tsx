"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Calendar, ClipboardList, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { Badge } from "~/components/ui/badge";
import { ProyectosSubNav } from "~/dashboard/proyectos/ProyectosSubNav";
import { listAllTasks } from "~/services/projectTasksService";
import { listProjects } from "~/services/projectsService";
import { listStaffMembers } from "~/services/staffService";
import type { ProjectRow, ProjectTaskWithProject, TaskStatus } from "~/types/alabastro";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "~/lib/alabastroLabels";
import { PersonAvatar } from "~/components/PersonAvatar";
import { TASK_COLUMN_UI, isDueOverdue } from "~/lib/projectUi";
import { cn, formatDateOnly } from "~/lib/utils";

const FILTER_ALL = "__all__";
const FILTER_UNASSIGNED = "__unassigned__";

export default function TasksBacklogPage() {
  const [tasks, setTasks] = useState<ProjectTaskWithProject[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(FILTER_ALL);
  const [assigneeFilter, setAssigneeFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | typeof FILTER_ALL>(FILTER_ALL);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, p, s] = await Promise.all([listAllTasks(), listProjects(), listStaffMembers()]);
    if (t.error) toast.error(t.error.message);
    if (p.error) toast.error(p.error.message);
    if (s.error) toast.error(s.error.message);
    setTasks(t.data);
    setProjects(p.data);
    setStaff(s.data.map((m) => ({ id: m.id, name: m.name })));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (projectFilter !== FILTER_ALL && t.project_id !== projectFilter) return false;
      if (statusFilter !== FILTER_ALL && t.status !== statusFilter) return false;
      if (assigneeFilter === FILTER_UNASSIGNED) {
        if (t.assigned_staff_id) return false;
      } else if (assigneeFilter !== FILTER_ALL && t.assigned_staff_id !== assigneeFilter) {
        return false;
      }
      if (onlyOverdue && !isDueOverdue(t.due_on)) return false;
      if (!q) return true;
      const hay = [
        t.title,
        t.description,
        t.projects?.title,
        t.projects?.clients?.name,
        t.staff_members?.name,
        TASK_STATUS_LABELS[t.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [tasks, search, projectFilter, assigneeFilter, statusFilter, onlyOverdue]);

  const stats = useMemo(() => {
    const unassigned = tasks.filter((t) => !t.assigned_staff_id).length;
    const overdue = tasks.filter((t) => isDueOverdue(t.due_on)).length;
    const active = tasks.filter((t) => t.status !== "terminado").length;
    return { total: tasks.length, unassigned, overdue, active };
  }, [tasks]);

  const hasFilters =
    search.trim() ||
    projectFilter !== FILTER_ALL ||
    assigneeFilter !== FILTER_ALL ||
    statusFilter !== FILTER_ALL ||
    onlyOverdue;

  const clearFilters = () => {
    setSearch("");
    setProjectFilter(FILTER_ALL);
    setAssigneeFilter(FILTER_ALL);
    setStatusFilter(FILTER_ALL);
    setOnlyOverdue(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-blue/15 text-accent-blue">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-blue">Tareas</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Backlog de todas las tareas del estudio. Filtra por proyecto, responsable o estado.
            </p>
          </div>
        </div>
      </div>

      <ProyectosSubNav active="tasks" />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 max-w-3xl">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Activas" value={stats.active} accent />
        <MiniStat label="Sin asignar" value={stats.unassigned} />
        <MiniStat label="Vencidas" value={stats.overdue} warn={stats.overdue > 0} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar tarea, proyecto o responsable…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label>Proyecto</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Todos los proyectos</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Responsable</Label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                  <SelectItem value={FILTER_UNASSIGNED}>Sin asignar</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as TaskStatus | typeof FILTER_ALL)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant={onlyOverdue ? "default" : "outline"}
                className={cn("w-full", onlyOverdue && "bg-red-600 hover:bg-red-600/90")}
                onClick={() => setOnlyOverdue((v) => !v)}
              >
                Solo vencidas
              </Button>
            </div>
          </div>
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            Backlog ({filtered.length}
            {filtered.length !== tasks.length ? ` de ${tasks.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando tareas…</p>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              {tasks.length === 0
                ? "No hay tareas aún. Crea un proyecto con paquete de música o añade tareas en un tablero."
                : "Ninguna tarea coincide con los filtros."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Tarea</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const colUi = TASK_COLUMN_UI[t.status];
                  const assignee = t.staff_members?.name;
                  const overdue = isDueOverdue(t.due_on);
                  return (
                    <TableRow key={t.id} className="group">
                      <TableCell>
                        <p className="font-medium leading-snug">{t.title}</p>
                        {t.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 max-w-md">
                            {t.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{t.projects?.title ?? "—"}</p>
                          {t.projects?.clients?.name && (
                            <p className="text-xs text-muted-foreground">{t.projects.clients.name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1.5 text-xs font-normal">
                          <span className={cn("size-1.5 rounded-full", colUi.dot)} />
                          {TASK_STATUS_LABELS[t.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignee ? (
                          <span className="inline-flex items-center gap-2 text-sm">
                            <PersonAvatar
                              name={assignee}
                              avatarColor={t.staff_members?.avatar_color}
                              avatarUrl={t.staff_members?.avatar_url}
                              size="sm"
                            />
                            {assignee}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.due_on ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-sm",
                              overdue && "font-medium text-red-700"
                            )}
                          >
                            <Calendar className="size-3.5 shrink-0" />
                            {formatDateOnly(t.due_on)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1 h-8" asChild>
                          <Link to={`/proyectos/${t.project_id}`}>
                            <ExternalLink className="size-3.5" />
                            <span className="sr-only sm:not-sr-only sm:inline">Tablero</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        warn ? "border-red-200 bg-red-50/80" : accent ? "border-accent-blue/25 bg-accent-blue/5" : "bg-card"
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xl font-bold tabular-nums",
          warn && "text-red-700",
          accent && !warn && "text-accent-blue"
        )}
      >
        {value}
      </p>
    </div>
  );
}
