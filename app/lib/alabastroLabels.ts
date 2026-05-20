import type {
  ObjectiveKind,
  ObjectiveStatus,
  ProjectStatus,
  StaffCargo,
  StartingPoint,
  TaskStatus,
} from "~/types/alabastro";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  en_revision: "En revisión",
  terminado: "Terminado",
};

export const TASK_STATUSES: TaskStatus[] = ["pendiente", "en_progreso", "en_revision", "terminado"];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  borrador: "Borrador",
  presupuesto: "Presupuesto / contratado",
  en_produccion: "En producción",
  revision: "En revisión",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const STARTING_POINT_LABELS: Record<StartingPoint, string> = {
  maqueta: "Tiene maqueta / demo",
  letra_solo: "Solo letra",
  desde_cero: "Desde cero (composición)",
  otro: "Otro / por definir",
};

export const OBJECTIVE_KIND_LABELS: Record<ObjectiveKind, string> = {
  equipo: "Equipo / compra",
  proyectos: "Proyectos",
  ingresos: "Ingresos",
  personalizado: "Personalizado",
};

export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completado: "Completado",
  cancelado: "Cancelado",
};

export const PACKAGE_CATEGORY_LABELS: Record<"musica" | "video", string> = {
  musica: "Música",
  video: "Video",
};

export const STAFF_CARGO_LABELS: Record<StaffCargo, string> = {
  socio: "Socio",
  productor: "Productor",
  musico: "Músico",
  gestor: "Gestor",
};

export const STAFF_CARGOS: StaffCargo[] = ["socio", "productor", "musico", "gestor"];
