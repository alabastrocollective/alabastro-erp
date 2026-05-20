import { endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import supabase from "~/utils/supabase";
import type { FinancialMovementRow, MovementType, PaymentMethod } from "~/types/alabastro";

export interface MonthlyBalance {
  year: number;
  month: number;
  monthLabel: string;
  startStr: string;
  endStr: string;
  fondoAnteriorUsd: number;
  totalEntradasUsd: number;
  totalSalidasUsd: number;
  saldoTotalUsd: number;
  countEntradas: number;
  countSalidas: number;
}

function monthBounds(year: number, month: number) {
  const ref = new Date(year, month - 1, 1);
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return {
    startStr: format(start, "yyyy-MM-dd"),
    endStr: format(end, "yyyy-MM-dd"),
    monthLabel: format(start, "MMMM yyyy", { locale: es }),
  };
}

function sumMovements(rows: FinancialMovementRow[]) {
  let ingresos = 0;
  let egresos = 0;
  for (const m of rows) {
    if (m.movement_type === "ingreso") ingresos += Number(m.amount_usd);
    else egresos += Number(m.amount_usd);
  }
  return { ingresos, egresos };
}

export async function listMovementsForMonth(
  year: number,
  month: number
): Promise<{ data: FinancialMovementRow[]; error: Error | null }> {
  const { startStr, endStr } = monthBounds(year, month);
  const { data, error } = await supabase
    .from("financial_movements")
    .select("*, projects(id, title), clients(id, name)")
    .gte("occurred_on", startStr)
    .lte("occurred_on", endStr)
    .order("occurred_on", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as FinancialMovementRow[], error: null };
}

export async function getMonthlyBalance(
  year: number,
  month: number
): Promise<{ data: MonthlyBalance | null; error: Error | null }> {
  const { startStr, endStr, monthLabel } = monthBounds(year, month);

  const [beforeRes, monthRes] = await Promise.all([
    supabase.from("financial_movements").select("*").lt("occurred_on", startStr),
    supabase.from("financial_movements").select("*").gte("occurred_on", startStr).lte("occurred_on", endStr),
  ]);

  if (beforeRes.error) return { data: null, error: new Error(beforeRes.error.message) };
  if (monthRes.error) return { data: null, error: new Error(monthRes.error.message) };

  const before = (beforeRes.data ?? []) as FinancialMovementRow[];
  const inMonth = (monthRes.data ?? []) as FinancialMovementRow[];

  const prev = sumMovements(before);
  const fondoAnteriorUsd = prev.ingresos - prev.egresos;

  const entradas = inMonth.filter((m) => m.movement_type === "ingreso");
  const salidas = inMonth.filter((m) => m.movement_type === "egreso");
  const monthSums = sumMovements(inMonth);

  const saldoTotalUsd = fondoAnteriorUsd + monthSums.ingresos - monthSums.egresos;

  return {
    data: {
      year,
      month,
      monthLabel,
      startStr,
      endStr,
      fondoAnteriorUsd,
      totalEntradasUsd: monthSums.ingresos,
      totalSalidasUsd: monthSums.egresos,
      saldoTotalUsd,
      countEntradas: entradas.length,
      countSalidas: salidas.length,
    },
    error: null,
  };
}

export async function listMovements(limit = 500): Promise<{ data: FinancialMovementRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("financial_movements")
    .select("*, projects(id, title), clients(id, name)")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data ?? []) as FinancialMovementRow[], error: null };
}

export async function createMovement(row: {
  movement_type: MovementType;
  amount_usd: number;
  occurred_on: string;
  category?: string | null;
  payment_method?: PaymentMethod | null;
  project_id?: string | null;
  client_id?: string | null;
  notes?: string | null;
}): Promise<{ data: FinancialMovementRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("financial_movements")
    .insert({
      movement_type: row.movement_type,
      amount_usd: row.amount_usd,
      occurred_on: row.occurred_on,
      category: row.category?.trim() || null,
      payment_method: row.payment_method ?? null,
      project_id: row.project_id ?? null,
      client_id: row.client_id ?? null,
      notes: row.notes?.trim() || null,
    })
    .select("*, projects(id, title), clients(id, name)")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as FinancialMovementRow, error: null };
}

export async function updateMovement(
  id: string,
  patch: Partial<{
    movement_type: MovementType;
    amount_usd: number;
    occurred_on: string;
    category: string | null;
    payment_method: PaymentMethod | null;
    project_id: string | null;
    client_id: string | null;
    notes: string | null;
  }>
): Promise<{ data: FinancialMovementRow | null; error: Error | null }> {
  const body = { ...patch };
  if (patch.notes !== undefined) body.notes = patch.notes?.trim() || null;
  if (patch.category !== undefined) body.category = patch.category?.trim() || null;
  const { data, error } = await supabase
    .from("financial_movements")
    .update(body)
    .eq("id", id)
    .select("*, projects(id, title), clients(id, name)")
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as FinancialMovementRow, error: null };
}

export async function deleteMovement(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("financial_movements").delete().eq("id", id);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
