"use client";

import { Calendar, GripVertical, Pencil, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { ProjectTaskRow, StaffMemberRow } from "~/types/alabastro";
import { STAFF_CARGO_LABELS } from "~/lib/alabastroLabels";
import { PersonAvatar } from "~/components/PersonAvatar";
import { isDueOverdue } from "~/lib/projectUi";
import { cn, formatDateOnly } from "~/lib/utils";

export function KanbanTaskCard({
  task,
  assigneeName,
  assigneeAvatarColor,
  assigneeAvatarUrl,
  assigneeCargo,
  dragging,
  onEdit,
  onDragStart,
  onDragEnd,
}: {
  task: ProjectTaskRow;
  assigneeName: string | null;
  assigneeAvatarColor?: string | null;
  assigneeAvatarUrl?: string | null;
  assigneeCargo?: string | null;
  dragging: boolean;
  onEdit: () => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}) {
  const overdue = isDueOverdue(task.due_on);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(task.id);
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-shadow cursor-grab active:cursor-grabbing",
        "hover:border-accent-blue/25 hover:shadow-md",
        dragging && "opacity-55 ring-2 ring-accent-blue/35 shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="size-4 shrink-0 text-muted-foreground/40 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{task.title}</p>
          {task.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Editar tarea"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {assigneeName ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 py-0.5 pl-0.5 pr-2 text-[11px] font-medium">
            <PersonAvatar
              name={assigneeName}
              avatarColor={assigneeAvatarColor}
              avatarUrl={assigneeAvatarUrl}
              size="xs"
            />
            <span className="max-w-[120px] truncate">{assigneeName}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            <User className="size-3" />
            Sin asignar
          </span>
        )}
        {task.due_on && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              overdue
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-border bg-background text-muted-foreground"
            )}
          >
            <Calendar className="size-3 shrink-0" />
            {formatDateOnly(task.due_on)}
          </span>
        )}
        {assigneeCargo && (
          <span className="rounded-full bg-secondary-blue px-2 py-0.5 text-[10px] text-primary-blue/80">
            {assigneeCargo}
          </span>
        )}
      </div>
    </div>
  );
}

export function resolveAssignee(
  task: ProjectTaskRow,
  staffById: Map<string, StaffMemberRow>
): {
  name: string | null;
  cargoLabel: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
} {
  const member = task.staff_members ?? (task.assigned_staff_id ? staffById.get(task.assigned_staff_id) : null);
  if (!member) return { name: null, cargoLabel: null, avatarColor: null, avatarUrl: null };
  return {
    name: member.name,
    cargoLabel: member.cargo ? STAFF_CARGO_LABELS[member.cargo] : null,
    avatarColor: member.avatar_color ?? null,
    avatarUrl: member.avatar_url ?? null,
  };
}
