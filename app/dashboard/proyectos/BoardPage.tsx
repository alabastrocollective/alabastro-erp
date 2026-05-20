"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Calendar, LayoutGrid, Music, Plus, Search, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
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
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { KanbanTaskCard, resolveAssignee } from "~/dashboard/proyectos/KanbanTaskCard";
import { ProyectosSubNav } from "~/dashboard/proyectos/ProyectosSubNav";
import {
  PACKAGE_CATEGORY_UI,
  PROJECT_STATUS_UI,
  TASK_COLUMN_UI,
  daysUntilDelivery,
  deliveryBadgeClass,
} from "~/lib/projectUi";
import { getProjectById } from "~/services/projectsService";
import {
  createTask,
  deleteTask,
  listTasksByProject,
  moveTask,
  updateTask,
} from "~/services/projectTasksService";
import { listStaffMembers } from "~/services/staffService";
import type { ProjectRow, ProjectTaskRow, StaffMemberRow, TaskStatus } from "~/types/alabastro";
import {
  PACKAGE_CATEGORY_LABELS,
  PROJECT_STATUS_LABELS,
  STAFF_CARGO_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "~/lib/alabastroLabels";
import { formatUsd, cn } from "~/lib/utils";

const STAFF_UNASSIGNED = "__none__";

const emptyTaskMeta = { assigneeId: STAFF_UNASSIGNED, dueOn: "" };

export default function ProyectoBoardPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [addColumn, setAddColumn] = useState<TaskStatus | null>(null);
  const [staff, setStaff] = useState<StaffMemberRow[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMeta, setNewMeta] = useState(emptyTaskMeta);
  const [editing, setEditing] = useState<ProjectTaskRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMeta, setEditMeta] = useState(emptyTaskMeta);
  const [savingTask, setSavingTask] = useState(false);
  const savingTaskRef = useRef(false);
  const [taskSearch, setTaskSearch] = useState("");

  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  const boardStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "terminado").length;
    const inProgress = tasks.filter((t) => t.status === "en_progreso" || t.status === "en_revision").length;
    const unassigned = tasks.filter((t) => !t.assigned_staff_id).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, unassigned, pct };
  }, [tasks]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [projRes, tasksRes, staffRes] = await Promise.all([
      getProjectById(projectId),
      listTasksByProject(projectId),
      listStaffMembers(),
    ]);
    if (projRes.error) toast.error(projRes.error.message);
    if (tasksRes.error) toast.error(tasksRes.error.message);
    if (staffRes.error) toast.error(staffRes.error.message);
    setStaff(staffRes.data);
    if (!projRes.data) {
      setProject(null);
    } else {
      setProject(projRes.data);
    }
    setTasks(tasksRes.data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const { name } = resolveAssignee(t, staffById);
      return [t.title, t.description, name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [tasks, taskSearch, staffById]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, ProjectTaskRow[]>();
    for (const s of TASK_STATUSES) map.set(s, []);
    for (const t of filteredTasks) {
      const list = map.get(t.status) ?? [];
      list.push(t);
      map.set(t.status, list);
    }
    for (const s of TASK_STATUSES) {
      map.get(s)?.sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
    }
    return map;
  }, [filteredTasks]);

  const handleDrop = async (status: TaskStatus, taskId: string) => {
    const columnTasks = tasksByStatus.get(status) ?? [];
    const newOrder = columnTasks.filter((t) => t.id !== taskId).length;
    const { data, error } = await moveTask(taskId, status, newOrder);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setTasks((prev) => {
        const without = prev.filter((t) => t.id !== taskId);
        return [...without, data];
      });
    }
    setDraggingId(null);
  };

  const parseAssignee = (value: string) => (value === STAFF_UNASSIGNED ? null : value);

  const openAdd = (status: TaskStatus) => {
    setAddColumn(status);
    setNewTitle("");
    setNewDescription("");
    setNewMeta(emptyTaskMeta);
  };

  const saveNewTask = async () => {
    if (savingTaskRef.current) return;
    if (!projectId || !addColumn || !newTitle.trim()) {
      toast.error("El título de la tarea es obligatorio");
      return;
    }
    savingTaskRef.current = true;
    setSavingTask(true);
    try {
      const { data, error } = await createTask({
        project_id: projectId,
        title: newTitle,
        description: newDescription || null,
        status: addColumn,
        assigned_staff_id: parseAssignee(newMeta.assigneeId),
        due_on: newMeta.dueOn || null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) setTasks((prev) => [...prev, data]);
      toast.success("Tarea creada");
      setAddColumn(null);
    } finally {
      savingTaskRef.current = false;
      setSavingTask(false);
    }
  };

  const openEdit = (task: ProjectTaskRow) => {
    setEditing(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditMeta({
      assigneeId: task.assigned_staff_id ?? STAFF_UNASSIGNED,
      dueOn: task.due_on ?? "",
    });
  };

  const saveEdit = async () => {
    if (savingTaskRef.current) return;
    if (!editing || !editTitle.trim()) return;
    savingTaskRef.current = true;
    setSavingTask(true);
    try {
      const { data, error } = await updateTask(editing.id, {
        title: editTitle,
        description: editDescription || null,
        assigned_staff_id: parseAssignee(editMeta.assigneeId),
        due_on: editMeta.dueOn || null,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      toast.success("Tarea actualizada");
      setEditing(null);
    } finally {
      savingTaskRef.current = false;
      setSavingTask(false);
    }
  };

  const removeTask = async (task: ProjectTaskRow) => {
    if (!confirm(`¿Eliminar la tarea «${task.title}»?`)) return;
    const { error } = await deleteTask(task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    toast.success("Tarea eliminada");
    setEditing(null);
  };

  if (!projectId) {
    return <p className="text-muted-foreground">Proyecto no encontrado.</p>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No se encontró el proyecto.</p>
        <Button variant="outline" asChild>
          <Link to="/proyectos">
            <ArrowLeft className="size-4 mr-2" />
            Volver a proyectos
          </Link>
        </Button>
      </div>
    );
  }

  const statusUi = PROJECT_STATUS_UI[project.status];
  const pkg = project.service_packages;
  const pkgUi = pkg ? PACKAGE_CATEGORY_UI[pkg.category] : null;
  const delivery = daysUntilDelivery(project.expected_delivery_on);

  return (
    <div className="w-full space-y-5">
      <ProyectosSubNav active="board" />

      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary-blue/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-accent-blue">
              <LayoutGrid className="size-5 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider">Tablero Kanban</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-blue dark:text-foreground sm:text-3xl truncate">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{project.clients?.name ?? "Sin cliente"}</span>
              {pkg && pkgUi && (
                <Badge variant="outline" className={cn("gap-1 border text-xs", pkgUi.badge)}>
                  {pkg.category === "musica" ? <Music className="size-3" /> : <Video className="size-3" />}
                  {PACKAGE_CATEGORY_LABELS[pkg.category]} · {pkg.name}
                </Badge>
              )}
              <span className="tabular-nums font-medium">{formatUsd(project.agreed_price_usd)}</span>
              <Badge variant="outline" className={cn("text-xs border", statusUi.badge)}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              {delivery && (
                <Badge variant="outline" className={cn("text-xs gap-1", deliveryBadgeClass(delivery.tone))}>
                  <Calendar className="size-3" />
                  {delivery.label}
                </Badge>
              )}
            </div>
          </div>

          {boardStats.total > 0 && (
            <div className="flex shrink-0 flex-col gap-2 sm:min-w-[200px]">
              <div className="flex items-end justify-between text-sm">
                <span className="text-muted-foreground">Avance</span>
                <span className="font-bold tabular-nums text-accent-blue">{boardStats.pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent-blue transition-all"
                  style={{ width: `${boardStats.pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                {boardStats.done} terminadas · {boardStats.inProgress} activas · {boardStats.unassigned} sin asignar
              </p>
            </div>
          )}
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 bg-card"
            placeholder="Buscar tarea o responsable…"
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-muted/25 p-3 sm:p-4">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 items-start">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasksByStatus.get(status) ?? [];
            const colUi = TASK_COLUMN_UI[status];
            return (
              <div
                key={status}
                className={cn(
                  "flex min-w-0 flex-col rounded-xl border min-h-[280px]",
                  colUi.column
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/task-id") || draggingId;
                  if (id) void handleDrop(status, id);
                }}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", colUi.dot)} />
                    <span className={cn("text-xs font-bold uppercase tracking-wide", colUi.header)}>
                      {TASK_STATUS_LABELS[status]}
                    </span>
                  </div>
                  <span className="flex size-6 items-center justify-center rounded-full bg-card text-xs font-semibold tabular-nums shadow-sm">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex min-h-[120px] flex-col gap-2.5 px-2.5 pb-3">
                  {columnTasks.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground/80">
                      Sin tareas aquí
                    </p>
                  )}
                  {columnTasks.map((task) => {
                    const { name, cargoLabel, avatarColor, avatarUrl } = resolveAssignee(task, staffById);
                    return (
                      <KanbanTaskCard
                        key={task.id}
                        task={task}
                        assigneeName={name}
                        assigneeAvatarColor={avatarColor}
                        assigneeAvatarUrl={avatarUrl}
                        assigneeCargo={cargoLabel}
                        dragging={draggingId === task.id}
                        onEdit={() => openEdit(task)}
                        onDragStart={setDraggingId}
                        onDragEnd={() => setDraggingId(null)}
                      />
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => openAdd(status)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-card/50 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent-blue/40 hover:bg-card hover:text-foreground"
                  >
                    <Plus className="size-4" />
                    Añadir tarea
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={addColumn !== null} onOpenChange={(o) => !o && setAddColumn(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nueva tarea — {addColumn ? TASK_STATUS_LABELS[addColumn] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Grabar voces principales"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-desc">Descripción (opcional)</Label>
              <Textarea
                id="task-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <TaskMetaFields
              staff={staff}
              assigneeId={newMeta.assigneeId}
              dueOn={newMeta.dueOn}
              onAssigneeChange={(assigneeId) => setNewMeta((m) => ({ ...m, assigneeId }))}
              onDueOnChange={(dueOn) => setNewMeta((m) => ({ ...m, dueOn }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddColumn(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={savingTask} onClick={() => void saveNewTask()}>
              {savingTask ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Estado</Label>
              <div className="flex flex-wrap gap-2">
                {TASK_STATUSES.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={editing?.status === s ? "default" : "outline"}
                    onClick={() => {
                      if (!editing) return;
                      void (async () => {
                        const col = tasksByStatus.get(s) ?? [];
                        const { data, error } = await moveTask(editing.id, s, col.length);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                        if (data) {
                          setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
                          setEditing(data);
                        }
                      })();
                    }}
                  >
                    {TASK_STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Descripción</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <TaskMetaFields
              staff={staff}
              assigneeId={editMeta.assigneeId}
              dueOn={editMeta.dueOn}
              onAssigneeChange={(assigneeId) => setEditMeta((m) => ({ ...m, assigneeId }))}
              onDueOnChange={(dueOn) => setEditMeta((m) => ({ ...m, dueOn }))}
            />
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              className="gap-1 sm:mr-auto"
              onClick={() => editing && void removeTask(editing)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="button" disabled={savingTask} onClick={() => void saveEdit()}>
                {savingTask ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskMetaFields({
  staff,
  assigneeId,
  dueOn,
  onAssigneeChange,
  onDueOnChange,
}: {
  staff: StaffMemberRow[];
  assigneeId: string;
  dueOn: string;
  onAssigneeChange: (id: string) => void;
  onDueOnChange: (date: string) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label>Responsable</Label>
        <Select value={assigneeId} onValueChange={onAssigneeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STAFF_UNASSIGNED}>Sin asignar</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.cargo ? ` · ${STAFF_CARGO_LABELS[s.cargo]}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {staff.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Registra personas en Personal para asignar responsables.
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="task-due">Fecha de vencimiento</Label>
        <Input
          id="task-due"
          type="date"
          value={dueOn}
          onChange={(e) => onDueOnChange(e.target.value)}
        />
      </div>
    </>
  );
}
