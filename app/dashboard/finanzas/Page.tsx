"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  DollarSign,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { listClients } from "~/services/clientsService";
import {
  createMovement,
  deleteMovement,
  getMonthlyBalance,
  listMovementsForMonth,
  updateMovement,
  type MonthlyBalance,
} from "~/services/finanzasService";
import { listProjects } from "~/services/projectsService";
import type { ClientRow, FinancialMovementRow, MovementType, PaymentMethod, ProjectRow } from "~/types/alabastro";
import {
  EGRESO_CATEGORIES,
  INGRESO_CATEGORIES,
  categoryLabel,
} from "~/lib/finanzasLabels";
import { formatUsd, cn } from "~/lib/utils";

const PAY_METHODS: PaymentMethod[] = ["efectivo", "paypal", "pago_movil", "transferencia", "otro"];

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function movementPerson(row: FinancialMovementRow): string {
  return row.clients?.name ?? row.projects?.title ?? "—";
}

function movementDescription(row: FinancialMovementRow): string {
  if (row.notes?.trim()) return row.notes.trim();
  if (row.payment_method) return row.payment_method.replace(/_/g, " ");
  return "—";
}

function exportMonthCsv(
  balance: MonthlyBalance,
  entradas: FinancialMovementRow[],
  salidas: FinancialMovementRow[]
) {
  const lines = [
    `Balance ${balance.monthLabel}`,
    `Fondo anterior,${balance.fondoAnteriorUsd}`,
    `Total entradas,${balance.totalEntradasUsd}`,
    `Total salidas,${balance.totalSalidasUsd}`,
    `Saldo total,${balance.saldoTotalUsd}`,
    "",
    "ENTRADAS",
    "Fecha,Categoría,Descripción,Persona,Monto USD",
    ...entradas.map(
      (r) =>
        `${r.occurred_on.slice(0, 10)},${categoryLabel(r.category)},${movementDescription(r).replace(/,/g, " ")},${movementPerson(r)},${r.amount_usd}`
    ),
    "",
    "SALIDAS",
    "Fecha,Categoría,Descripción,Persona,Monto USD",
    ...salidas.map(
      (r) =>
        `${r.occurred_on.slice(0, 10)},${categoryLabel(r.category)},${movementDescription(r).replace(/,/g, " ")},${movementPerson(r)},${r.amount_usd}`
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finanzas-${balance.year}-${String(balance.month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FinanzasPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [balance, setBalance] = useState<MonthlyBalance | null>(null);
  const [rows, setRows] = useState<FinancialMovementRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialMovementRow | null>(null);
  const [form, setForm] = useState({
    movement_type: "ingreso" as MovementType,
    amount_usd: "",
    occurred_on: todayISODate(),
    category: "pago_cliente",
    payment_method: "pago_movil" as PaymentMethod | "__none__",
    project_id: "__none__",
    client_id: "__none__",
    notes: "",
  });

  const monthTitle = useMemo(() => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    return format(d, "MMMM yyyy", { locale: es });
  }, [viewYear, viewMonth]);

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [balRes, movRes, c, p] = await Promise.all([
      getMonthlyBalance(viewYear, viewMonth),
      listMovementsForMonth(viewYear, viewMonth),
      listClients(),
      listProjects(),
    ]);
    if (balRes.error) toast.error(balRes.error.message);
    if (movRes.error) toast.error(movRes.error.message);
    setBalance(balRes.data);
    setRows(movRes.data);
    setClients(c.data);
    setProjects(p.data);
    setLoading(false);
  }, [viewYear, viewMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const entradas = useMemo(() => rows.filter((r) => r.movement_type === "ingreso"), [rows]);
  const salidas = useMemo(() => rows.filter((r) => r.movement_type === "egreso"), [rows]);

  const shiftMonth = (delta: number) => {
    const d = addMonths(new Date(viewYear, viewMonth - 1, 1), delta);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth() + 1);
  };

  const openCreate = (type: MovementType) => {
    setEditing(null);
    const { startStr, endStr } = balance ?? { startStr: "", endStr: "" };
    const defaultDate =
      viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1
        ? todayISODate()
        : startStr || todayISODate();
    setForm({
      movement_type: type,
      amount_usd: "",
      occurred_on: defaultDate <= (endStr || defaultDate) ? defaultDate : startStr,
      category: type === "ingreso" ? "pago_cliente" : "equipo",
      payment_method: type === "ingreso" ? "pago_movil" : "__none__",
      project_id: "__none__",
      client_id: "__none__",
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (row: FinancialMovementRow) => {
    setEditing(row);
    setForm({
      movement_type: row.movement_type,
      amount_usd: String(row.amount_usd),
      occurred_on: row.occurred_on.slice(0, 10),
      category: row.category || (row.movement_type === "ingreso" ? "pago_cliente" : "otro_egreso"),
      payment_method: row.payment_method ?? "__none__",
      project_id: row.project_id ?? "__none__",
      client_id: row.client_id ?? "__none__",
      notes: row.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    const amount = Number(form.amount_usd);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Monto inválido (USD)");
      return;
    }
    const payload = {
      movement_type: form.movement_type,
      amount_usd: amount,
      occurred_on: form.occurred_on,
      category: form.category || null,
      payment_method:
        form.movement_type === "ingreso" && form.payment_method !== "__none__"
          ? (form.payment_method as PaymentMethod)
          : null,
      project_id: form.project_id === "__none__" ? null : form.project_id,
      client_id: form.client_id === "__none__" ? null : form.client_id,
      notes: form.notes || null,
    };

    if (editing) {
      const { error } = await updateMovement(editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Movimiento actualizado");
    } else {
      const { error } = await createMovement(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(form.movement_type === "ingreso" ? "Entrada registrada" : "Salida registrada");
    }
    setOpen(false);
    void load();
  };

  const remove = async (row: FinancialMovementRow) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const { error } = await deleteMovement(row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Eliminado");
    void load();
  };

  const catOptions =
    form.movement_type === "ingreso" ? [...INGRESO_CATEGORIES] : [...EGRESO_CATEGORIES];

  const b = balance ?? {
    fondoAnteriorUsd: 0,
    totalEntradasUsd: 0,
    totalSalidasUsd: 0,
    saldoTotalUsd: 0,
    countEntradas: 0,
    countSalidas: 0,
  };

  return (
    <div className="space-y-5 -mx-1 sm:mx-0">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-blue/10 text-primary-blue">
            <FileSpreadsheet className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-blue">Finanzas</h1>
            <p className="text-sm text-muted-foreground">Balance mensual · montos en USD</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => openCreate("ingreso")}
          >
            <Plus className="size-4" />
            Entrada
          </Button>
          <Button
            type="button"
            className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => openCreate("egreso")}
          >
            <Plus className="size-4" />
            Salida
          </Button>
        </div>
      </div>

      {/* Selector de mes */}
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2 sm:flex-1">
            <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft className="size-5" />
            </Button>
            <p className="min-w-[200px] text-center text-sm font-medium capitalize sm:text-base">
              Balance mes: <span className="font-semibold text-primary-blue">{monthTitle}</span>
            </p>
            <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
              <ChevronRight className="size-5" />
            </Button>
          </div>
          <Select
            value={String(viewYear)}
            onValueChange={(v) => setViewYear(Number(v))}
          >
            <SelectTrigger className="w-[100px] sm:ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Cargando balance…</p>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border bg-muted/40">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fondo anterior</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{formatUsd(b.fondoAnteriorUsd)}</p>
                </div>
                <Wallet className="size-8 text-muted-foreground/60" />
              </CardContent>
            </Card>
            <Card className="border bg-emerald-50/80 dark:bg-emerald-950/20">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                    Total entradas
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatUsd(b.totalEntradasUsd)}
                  </p>
                  <p className="text-xs text-emerald-700/80 mt-0.5">{b.countEntradas} registros</p>
                </div>
                <ArrowUpRight className="size-8 text-emerald-600/70" />
              </CardContent>
            </Card>
            <Card className="border bg-red-50/80 dark:bg-red-950/20">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-medium text-red-800 dark:text-red-300 uppercase tracking-wide">
                    Total salidas
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-red-700 dark:text-red-400">
                    {formatUsd(b.totalSalidasUsd)}
                  </p>
                  <p className="text-xs text-red-700/80 mt-0.5">{b.countSalidas} registros</p>
                </div>
                <ArrowDownRight className="size-8 text-red-600/70" />
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Saldo del mes</span>
                    <span className="font-semibold tabular-nums">
                      {formatUsd(b.totalEntradasUsd - b.totalSalidasUsd)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between gap-4">
                    <span className="font-medium">Saldo total</span>
                    <span className="font-bold tabular-nums text-primary-blue">{formatUsd(b.saldoTotalUsd)}</span>
                  </div>
                </div>
                <DollarSign className="size-8 text-muted-foreground/50 shrink-0" />
              </CardContent>
            </Card>
          </div>

          {/* Tablas entradas / salidas */}
          <div className="grid gap-4 lg:grid-cols-2">
            <MovementSection
              title="Entradas"
              variant="ingreso"
              rows={entradas}
              fondoAnterior={b.fondoAnteriorUsd}
              totalLabel="TOTAL ENTRADAS"
              totalAmount={b.fondoAnteriorUsd + b.totalEntradasUsd}
              onAdd={() => openCreate("ingreso")}
              onEdit={openEdit}
              onRemove={remove}
            />
            <MovementSection
              title="Salidas"
              variant="egreso"
              rows={salidas}
              totalLabel="TOTAL SALIDAS"
              totalAmount={b.totalSalidasUsd}
              onAdd={() => openCreate("egreso")}
              onEdit={openEdit}
              onRemove={remove}
            />
          </div>

          {/* Barra saldo + export */}
          <div
            className="flex flex-col gap-3 rounded-xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: "var(--color-primary-blue)" }}
          >
            <span className="text-sm font-bold uppercase tracking-wider text-white">Saldo actual</span>
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-300">
              {formatUsd(b.saldoTotalUsd)}
            </span>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!balance}
              onClick={() => balance && exportMonthCsv(balance, entradas, salidas)}
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Editar movimiento"
                : form.movement_type === "ingreso"
                  ? "Nueva entrada"
                  : "Nueva salida"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="m-amount">Monto (USD)</Label>
              <Input
                id="m-amount"
                inputMode="decimal"
                value={form.amount_usd}
                onChange={(e) => setForm((f) => ({ ...f, amount_usd: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-date">Fecha</Label>
              <Input
                id="m-date"
                type="date"
                value={form.occurred_on}
                onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.movement_type === "ingreso" && (
              <div className="grid gap-2">
                <Label>Método de pago</Label>
                <Select
                  value={form.payment_method}
                  onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v as PaymentMethod | "__none__" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {PAY_METHODS.map((pm) => (
                      <SelectItem key={pm} value={pm}>
                        {pm.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="m-desc">Descripción / notas</Label>
              <Textarea
                id="m-desc"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Detalle del movimiento"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cliente (persona)</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Proyecto (opcional)</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void save()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MovementSection({
  title,
  variant,
  rows,
  fondoAnterior,
  totalLabel,
  totalAmount,
  onAdd,
  onEdit,
  onRemove,
}: {
  title: string;
  variant: "ingreso" | "egreso";
  rows: FinancialMovementRow[];
  fondoAnterior?: number;
  totalLabel: string;
  totalAmount: number;
  onAdd: () => void;
  onEdit: (row: FinancialMovementRow) => void;
  onRemove: (row: FinancialMovementRow) => void;
}) {
  const isIngreso = variant === "ingreso";
  const Icon = isIngreso ? ArrowUpRight : ArrowDownRight;
  const headerColor = isIngreso ? "text-emerald-700" : "text-red-700";
  const footerBg = isIngreso ? "bg-emerald-50" : "bg-red-50";
  const amountColor = isIngreso ? "text-emerald-700" : "text-red-700";
  const badgeClass = isIngreso
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : "bg-red-100 text-red-800 border-red-200";

  return (
    <Card className="border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className={cn("flex items-center gap-2 font-semibold", headerColor)}>
          <Icon className="size-5" />
          {title}
        </h2>
        <Button type="button" variant="outline" size="sm" className="gap-1 h-8" onClick={onAdd}>
          <Plus className="size-3.5" />
          Agregar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-[72px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  No hay {isIngreso ? "entradas" : "salidas"} este mes
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm whitespace-nowrap">{r.occurred_on.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-normal", badgeClass)}>
                      {categoryLabel(r.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-sm">{movementDescription(r)}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-sm">{movementPerson(r)}</TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums whitespace-nowrap", amountColor)}>
                    {isIngreso ? "+" : "−"} {formatUsd(r.amount_usd)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => onEdit(r)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => onRemove(r)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {isIngreso && fondoAnterior !== undefined && (
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={4} className="text-sm font-medium text-muted-foreground">
                  Fondo anterior
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">{formatUsd(fondoAnterior)}</TableCell>
                <TableCell />
              </TableRow>
            )}
            <TableRow className={cn(footerBg, "hover:bg-inherit font-semibold")}>
              <TableCell colSpan={4}>{totalLabel}</TableCell>
              <TableCell className={cn("text-right tabular-nums", amountColor)}>{formatUsd(totalAmount)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
