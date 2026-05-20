"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { getMonthlyTotals, getProjectStatusCounts } from "~/services/dashboardService";
import { PROJECT_STATUS_LABELS } from "~/lib/alabastroLabels";
import { formatUsd } from "~/lib/utils";
import { toast } from "sonner";

export default function ReportesPage() {
  const [months, setMonths] = useState<{ monthLabel: string; ingresosUsd: number; egresosUsd: number }[]>([]);
  const [statuses, setStatuses] = useState<{ status: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [m, s] = await Promise.all([getMonthlyTotals(6), getProjectStatusCounts()]);
      if (cancelled) return;
      if (m.error) toast.error(m.error.message);
      if (s.error) toast.error(s.error.message);
      setMonths(m.data.map((x) => ({ monthLabel: x.monthLabel, ingresosUsd: x.ingresosUsd, egresosUsd: x.egresosUsd })));
      setStatuses(s.data.sort((a, b) => b.count - a.count));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = months.map((row) => ({
    mes: row.monthLabel,
    Ingresos: row.ingresosUsd,
    Egresos: row.egresosUsd,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm">Últimos 6 meses (USD) y proyectos por estado.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs egresos</CardTitle>
          <CardDescription>Movimientos registrados por mes calendario.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px] w-full min-w-0">
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => [formatUsd(Number(value)), ""]}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Legend />
                <Bar dataKey="Ingresos" fill="var(--color-accent-blue)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="var(--color-primary-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proyectos por estado</CardTitle>
          <CardDescription>Conteo actual en la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando…</p>
          ) : statuses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin proyectos aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>
                      {PROJECT_STATUS_LABELS[row.status as keyof typeof PROJECT_STATUS_LABELS] ?? row.status}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
