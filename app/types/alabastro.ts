export type ProjectStatus =
  | "borrador"
  | "presupuesto"
  | "en_produccion"
  | "revision"
  | "entregado"
  | "cancelado";

export type StartingPoint = "maqueta" | "letra_solo" | "desde_cero" | "otro";

export type MovementType = "ingreso" | "egreso";

export type PaymentMethod = "efectivo" | "paypal" | "pago_movil" | "transferencia" | "otro";

export type ObjectiveKind = "equipo" | "proyectos" | "ingresos" | "personalizado";

export type ObjectiveStatus = "pendiente" | "en_curso" | "completado" | "cancelado";

export interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type StaffCargo = "socio" | "productor" | "musico" | "gestor";

export interface StaffMemberRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cargo: StaffCargo | null;
  avatar_color: string | null;
  avatar_url: string | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskCommentRow {
  id: string;
  task_id: string;
  staff_member_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  staff_members?: Pick<StaffMemberRow, "id" | "name" | "cargo" | "avatar_color" | "avatar_url"> | null;
}

export interface ServicePackageRow {
  id: string;
  category: "musica" | "video";
  name: string;
  price_regular_usd: number;
  price_promo_usd: number;
  promo_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "pendiente" | "en_progreso" | "en_revision" | "terminado";

export interface ProjectTaskRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  sort_order: number;
  assigned_staff_id: string | null;
  due_on: string | null;
  created_at: string;
  updated_at: string;
  staff_members?: Pick<StaffMemberRow, "id" | "name" | "cargo" | "avatar_color" | "avatar_url"> | null;
}

export interface ProjectTaskWithProject extends ProjectTaskRow {
  projects: Pick<ProjectRow, "id" | "title" | "status"> & {
    clients: Pick<ClientRow, "name"> | null;
  } | null;
}

export interface ProjectRow {
  id: string;
  client_id: string;
  service_package_id: string | null;
  title: string;
  agreed_price_usd: number;
  deposit_percent: number;
  status: ProjectStatus;
  starting_point: StartingPoint;
  notes: string | null;
  expected_delivery_on: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: ClientRow | null;
  service_packages?: ServicePackageRow | null;
}

export interface FinancialMovementRow {
  id: string;
  movement_type: MovementType;
  amount_usd: number;
  occurred_on: string;
  category: string | null;
  payment_method: PaymentMethod | null;
  project_id: string | null;
  client_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects?: Pick<ProjectRow, "id" | "title"> | null;
  clients?: Pick<ClientRow, "id" | "name"> | null;
}

export interface ObjectiveProgressEntryRow {
  id: string;
  objective_id: string;
  amount: number;
  description: string | null;
  occurred_on: string;
  created_at: string;
  updated_at: string;
}

export interface ObjectiveRow {
  id: string;
  title: string;
  description: string | null;
  objective_kind: ObjectiveKind;
  target_number: number | null;
  current_progress: number;
  unit_label: string | null;
  deadline_on: string | null;
  status: ObjectiveStatus;
  created_at: string;
  updated_at: string;
}
