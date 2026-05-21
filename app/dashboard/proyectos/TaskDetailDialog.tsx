"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Link2, MessageSquare, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { AssigneeBadge } from "~/components/AssigneeBadge";
import { PersonAvatar } from "~/components/PersonAvatar";
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
import { createTaskComment, deleteTaskComment, listTaskComments } from "~/services/taskCommentsService";
import type { ProjectRow, ProjectTaskCommentRow, ProjectTaskRow, StaffMemberRow, TaskStatus } from "~/types/alabastro";
import { STAFF_CARGO_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "~/lib/alabastroLabels";
import { TASK_COLUMN_UI } from "~/lib/projectUi";
import { cn } from "~/lib/utils";

const STAFF_UNASSIGNED = "__none__";

/** Ancho del panel de detalle de tarea (desktop). */
const TASK_DIALOG_MAX = "sm:!max-w-[min(94vw,56rem)] md:!max-w-[min(92vw,60rem)]";

export type TaskDetailMeta = { assigneeId: string; dueOn: string };

type TaskDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project: ProjectRow | null;
  task: ProjectTaskRow | null;
  initialStatus?: TaskStatus;
  staff: StaffMemberRow[];
  currentStaffMember: StaffMemberRow | null;
  staffLinkLoading?: boolean;
  title: string;
  description: string;
  meta: TaskDetailMeta;
  saving: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onMetaChange: (patch: Partial<TaskDetailMeta>) => void;
  onStatusChange?: (status: TaskStatus) => void;
  onSave: () => void;
  onDelete?: () => void;
};

function formatCommentDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  mode,
  project,
  task,
  initialStatus,
  staff,
  currentStaffMember,
  staffLinkLoading,
  title,
  description,
  meta,
  saving,
  onTitleChange,
  onDescriptionChange,
  onMetaChange,
  onStatusChange,
  onSave,
  onDelete,
}: TaskDetailDialogProps) {
  const [comments, setComments] = useState<ProjectTaskCommentRow[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const status = mode === "edit" ? task?.status : initialStatus;
  const statusUi = status ? TASK_COLUMN_UI[status] : null;
  const showComments = mode === "edit" && !!task;

  const loadComments = useCallback(async () => {
    if (!task?.id) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    const { data, error } = await listTaskComments(task.id);
    if (error) toast.error(error.message);
    setComments(data);
    setCommentsLoading(false);
  }, [task?.id]);

  useEffect(() => {
    if (open && showComments) void loadComments();
    if (!open) setCommentDraft("");
  }, [open, showComments, loadComments]);

  const submitComment = async () => {
    if (!task?.id) return;
    if (!currentStaffMember) {
      toast.error("Vincula tu cuenta con una persona en Personal (Configuración) para comentar.");
      return;
    }
    if (!commentDraft.trim()) return;
    setPostingComment(true);
    const { data, error } = await createTaskComment(task.id, currentStaffMember.id, commentDraft);
    setPostingComment(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setComments((prev) => [...prev, data]);
    setCommentDraft("");
    toast.success("Comentario añadido");
  };

  const removeComment = async (id: string) => {
    const { error } = await deleteTaskComment(id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const selectedStaff = staff.find((s) => s.id === meta.assigneeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        fullScreenOnMobile
        className={cn(
          "flex max-h-[min(92vh,880px)] flex-col gap-0 overflow-hidden p-0",
          TASK_DIALOG_MAX
        )}
      >
        <DialogHeader className="shrink-0 space-y-4 border-b border-border px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pr-10">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              {mode === "edit" && statusUi && onStatusChange && (
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 shrink-0 rounded-full", statusUi.dot)} />
                  <Select value={task?.status} onValueChange={(v) => onStatusChange(v as TaskStatus)}>
                    <SelectTrigger className="h-9 min-w-[11rem] text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {TASK_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {mode === "create" && initialStatus && (
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium">
                  {TASK_STATUS_LABELS[initialStatus]}
                </span>
              )}
              {project && (
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground/70">Proyecto:</span>{" "}
                  <span className="font-medium text-foreground">{project.title}</span>
                  {project.clients?.name && (
                    <span className="text-muted-foreground"> · {project.clients.name}</span>
                  )}
                </p>
              )}
            </div>
            {selectedStaff && (
              <AssigneeBadge
                name={selectedStaff.name}
                avatarColor={selectedStaff.avatar_color}
                avatarUrl={selectedStaff.avatar_url}
                size="sm"
              />
            )}
          </div>

          <DialogTitle className="sr-only">
            {mode === "create" ? "Nueva tarea" : `Tarea: ${task?.title ?? ""}`}
          </DialogTitle>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Título de la tarea"
            className="h-auto border-0 bg-transparent px-0 py-1 text-xl font-semibold leading-tight shadow-none focus-visible:ring-0 sm:text-2xl"
          />
        </DialogHeader>

        <div
          className={cn(
            "grid min-h-0 flex-1 overflow-hidden",
            showComments
              ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,38%)]"
              : "grid-cols-1"
          )}
        >
          <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7 lg:border-r lg:border-border">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <User className="size-4 text-muted-foreground" />
                    Responsable
                  </Label>
                  <Select value={meta.assigneeId} onValueChange={(v) => onMetaChange({ assigneeId: v })}>
                    <SelectTrigger className="h-10 w-full">
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
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-detail-due" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="size-4 text-muted-foreground" />
                    Fecha de vencimiento
                  </Label>
                  <Input
                    id="task-detail-due"
                    type="date"
                    value={meta.dueOn}
                    onChange={(e) => onMetaChange({ dueOn: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="task-detail-desc" className="text-sm font-medium">
                  Descripción
                </Label>
                <Textarea
                  id="task-detail-desc"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={10}
                  placeholder="Referencias, tomas, notas de mezcla, enlaces…"
                  className="min-h-[220px] resize-y text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>

          {showComments && (
            <aside className="flex min-h-[280px] min-w-0 flex-col bg-muted/10 lg:min-h-0">
              <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-4 sm:px-6">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Comentarios</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {comments.length}
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 sm:px-6">
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : comments.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aún no hay comentarios en esta tarea.
                  </p>
                ) : (
                  comments.map((c) => {
                    const author = c.staff_members;
                    const name = author?.name ?? "Usuario";
                    const canDelete =
                      currentStaffMember && c.staff_member_id === currentStaffMember.id;
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-border/80 bg-card p-4 text-sm shadow-sm"
                      >
                        <div className="flex gap-3">
                          <PersonAvatar
                            name={name}
                            avatarColor={author?.avatar_color}
                            avatarUrl={author?.avatar_url}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold leading-tight">{name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatCommentDate(c.created_at)}
                                </p>
                              </div>
                              {canDelete && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 shrink-0"
                                  onClick={() => void removeComment(c.id)}
                                  aria-label="Eliminar comentario"
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {c.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="shrink-0 space-y-3 border-t border-border bg-card/50 px-5 py-4 sm:px-6">
                {!staffLinkLoading && !currentStaffMember && (
                  <p className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
                    <Link2 className="size-4 shrink-0" />
                    Vincula tu usuario en Configuración → Cuenta y Personal para firmar comentarios.
                  </p>
                )}
                <Textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  rows={4}
                  placeholder={
                    currentStaffMember ? "Escribe un comentario…" : "Vincula tu cuenta para comentar"
                  }
                  disabled={!currentStaffMember || postingComment}
                  className="resize-none text-sm"
                />
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={!currentStaffMember || postingComment || !commentDraft.trim()}
                  onClick={() => void submitComment()}
                >
                  {postingComment ? "Publicando…" : "Comentar"}
                </Button>
              </div>
            </aside>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-3 border-t border-border bg-muted/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {mode === "edit" && onDelete ? (
            <Button type="button" variant="destructive" className="gap-2 w-full sm:w-auto" onClick={onDelete}>
              <Trash2 className="size-4" />
              Eliminar tarea
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}
          <div className="flex w-full gap-3 sm:ml-auto sm:w-auto">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1 sm:min-w-[120px]" disabled={saving} onClick={onSave}>
              {saving ? "Guardando…" : mode === "create" ? "Crear tarea" : "Guardar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
