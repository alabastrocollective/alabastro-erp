import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import supabase from "~/utils/supabase";
import { getTaskSummariesByProjectIds } from "~/services/projectTasksService";
import type { FinancialMovementRow, ProjectRow, ProjectStatus } from "~/types/alabastro";

const IN_PROGRESS_STATUSES: ProjectStatus[] = ["presupuesto", "en_produccion", "revision"];

export interface ProjectInProgressItem {
  project: ProjectRow;
  tasksTotal: number;
  tasksDone: number;
  progressPct: number;
}

function monthRangeUtc(reference = new Date()) {
  const start = startOfMonth(reference);
  const end = endOfMonth(reference);
  return { start, end, startStr: format(start, "yyyy-MM-dd"), endStr: format(end, "yyyy-MM-dd") };
}

function dateInRange(isoDate: string | null, startStr: string, endStr: string): boolean {
  if (!isoDate) return false;
  const d = isoDate.slice(0, 10);
  return d >= startStr && d <= endStr;
}

export interface DashboardSummary {
  monthLabel: string;
  ingresosUsd: number;
  egresosUsd: number;
  proyectosEnCurso: number;
  proyectosEntregadosMes: number;
}

export async function getDashboardSummary(): Promise<{ data: DashboardSummary | null; error: Error | null }> {
  const { start, end, startStr, endStr } = monthRangeUtc();
  const monthLabel = format(start, "MMMM yyyy", { locale: es });

  const [movRes, projRes] = await Promise.all([
    supabase.from("financial_movements").select("*").gte("occurred_on", startStr).lte("occurred_on", endStr),
    supabase.from("projects").select("*"),
  ]);

  if (movRes.error) return { data: null, error: new Error(movRes.error.message) };
  if (projRes.error) return { data: null, error: new Error(projRes.error.message) };

  const movements = (movRes.data ?? []) as FinancialMovementRow[];
  let ingresosUsd = 0;
  let egresosUsd = 0;
  for (const m of movements) {
    if (m.movement_type === "ingreso") ingresosUsd += Number(m.amount_usd);
    else egresosUsd += Number(m.amount_usd);
  }

  const projects = (projRes.data ?? []) as ProjectRow[];
  const enCursoStatuses = new Set(IN_PROGRESS_STATUSES);
  const proyectosEnCurso = projects.filter((p) => enCursoStatuses.has(p.status)).length;

  const proyectosEntregadosMes = projects.filter((p) => {
    if (p.status !== "entregado") return false;
    const ref = p.delivered_at || p.updated_at;
    return dateInRange(ref, startStr, endStr);
  }).length;

  return {
    data: {
      monthLabel,
      ingresosUsd,
      egresosUsd,
      proyectosEnCurso,
      proyectosEntregadosMes,
    },
    error: null,
  };
}

export interface MonthTotals {
  monthKey: string;
  monthLabel: string;
  ingresosUsd: number;
  egresosUsd: number;
}

/** Últimos `months` meses calendario (incluye el mes actual). */
export async function getMonthlyTotals(months = 6): Promise<{ data: MonthTotals[]; error: Error | null }> {
  const now = new Date();
  const firstMonth = subMonths(startOfMonth(now), months - 1);
  const startStr = format(firstMonth, "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("financial_movements")
    .select("*")
    .gte("occurred_on", startStr);
  if (error) return { data: [], error: new Error(error.message) };

  const movements = (data ?? []) as FinancialMovementRow[];
  const buckets: MonthTotals[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const { startStr: ms, endStr: me } = monthRangeUtc(ref);
    let ingresosUsd = 0;
    let egresosUsd = 0;
    for (const m of movements) {
      const d = m.occurred_on.slice(0, 10);
      if (d < ms || d > me) continue;
      if (m.movement_type === "ingreso") ingresosUsd += Number(m.amount_usd);
      else egresosUsd += Number(m.amount_usd);
    }
    buckets.push({
      monthKey: format(ref, "yyyy-MM"),
      monthLabel: format(ref, "MMM yy", { locale: es }),
      ingresosUsd,
      egresosUsd,
    });
  }
  return { data: buckets, error: null };
}

export async function getProjectStatusCounts(): Promise<{
  data: { status: string; count: number }[];
  error: Error | null;
}> {
  const { data, error } = await supabase.from("projects").select("status");
  if (error) return { data: [], error: new Error(error.message) };
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const s = (row as { status: string }).status;
    map.set(s, (map.get(s) ?? 0) + 1);
  }
  return { data: Array.from(map.entries()).map(([status, count]) => ({ status, count })), error: null };
}

function isoDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export interface DayProjectActivity {
  dateKey: string;
  dayLabel: string;
  nuevos: number;
  entregasPrevistas: number;
  entregados: number;
}

/** Conteo diario de proyectos en el mes calendario de `reference`. */
export async function getMonthProjectActivity(
  reference = new Date()
): Promise<{ data: DayProjectActivity[]; error: Error | null }> {
  const { start, end } = monthRangeUtc(reference);
  const { data, error } = await supabase
    .from("projects")
    .select("created_at, expected_delivery_on, delivered_at, status");
  if (error) return { data: [], error: new Error(error.message) };

  const projects = (data ?? []) as Pick<
    ProjectRow,
    "created_at" | "expected_delivery_on" | "delivered_at" | "status"
  >[];

  const days = eachDayOfInterval({ start, end });
  const buckets = days.map((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return {
      dateKey,
      dayLabel: format(day, "d MMM", { locale: es }),
      nuevos: 0,
      entregasPrevistas: 0,
      entregados: 0,
    };
  });
  const byKey = new Map(buckets.map((b) => [b.dateKey, b]));

  for (const p of projects) {
    if (p.status === "cancelado") continue;
    const created = isoDateOnly(p.created_at);
    if (created && byKey.has(created)) byKey.get(created)!.nuevos += 1;

    const expected = isoDateOnly(p.expected_delivery_on);
    if (expected && byKey.has(expected)) byKey.get(expected)!.entregasPrevistas += 1;

    const delivered = isoDateOnly(p.delivered_at);
    if (delivered && byKey.has(delivered)) byKey.get(delivered)!.entregados += 1;
  }

  return { data: buckets, error: null };
}

export type HomeCalendarEventKind = "entrega_proyecto" | "objetivo";

export interface HomeCalendarEvent {
  id: string;
  date: string;
  kind: HomeCalendarEventKind;
  title: string;
  href: string;
}

/** Entregas previstas de proyectos y vencimientos de objetivos en un mes. */
export async function getHomeCalendarEvents(
  monthRef: Date
): Promise<{ data: HomeCalendarEvent[]; error: Error | null }> {
  const { startStr, endStr } = monthRangeUtc(monthRef);

  const [projRes, objRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, expected_delivery_on, status")
      .not("expected_delivery_on", "is", null)
      .gte("expected_delivery_on", startStr)
      .lte("expected_delivery_on", endStr),
    supabase
      .from("objectives")
      .select("id, title, deadline_on, status")
      .not("deadline_on", "is", null)
      .gte("deadline_on", startStr)
      .lte("deadline_on", endStr)
      .neq("status", "cancelado"),
  ]);

  if (projRes.error) return { data: [], error: new Error(projRes.error.message) };
  if (objRes.error) return { data: [], error: new Error(objRes.error.message) };

  const events: HomeCalendarEvent[] = [];

  for (const p of projRes.data ?? []) {
    const row = p as Pick<ProjectRow, "id" | "title" | "expected_delivery_on" | "status">;
    if (row.status === "cancelado") continue;
    const date = isoDateOnly(row.expected_delivery_on);
    if (!date) continue;
    events.push({
      id: `project-${row.id}`,
      date,
      kind: "entrega_proyecto",
      title: row.title,
      href: `/proyectos/${row.id}`,
    });
  }

  for (const o of objRes.data ?? []) {
    const row = o as { id: string; title: string; deadline_on: string | null };
    const date = isoDateOnly(row.deadline_on);
    if (!date) continue;
    events.push({
      id: `objective-${row.id}`,
      date,
      kind: "objetivo",
      title: row.title,
      href: `/objetivos/${row.id}`,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return { data: events, error: null };
}

/** Proyectos en curso con progreso del tablero (tareas terminadas / total). */
export async function getProjectsInProgress(): Promise<{
  data: ProjectInProgressItem[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), service_packages(*)")
    .in("status", IN_PROGRESS_STATUSES)
    .order("expected_delivery_on", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) return { data: [], error: new Error(error.message) };

  const projects = (data ?? []) as ProjectRow[];
  const ids = projects.map((p) => p.id);
  const sumRes = await getTaskSummariesByProjectIds(ids);
  if (sumRes.error) return { data: [], error: sumRes.error };

  const items: ProjectInProgressItem[] = projects.map((project) => {
    const s = sumRes.data[project.id] ?? { total: 0, terminado: 0 };
    const tasksTotal = s.total;
    const tasksDone = s.terminado;
    const progressPct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
    return { project, tasksTotal, tasksDone, progressPct };
  });

  return { data: items, error: null };
}
