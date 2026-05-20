"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { DayProjectActivity } from "~/services/dashboardService";

const SERIES = [
  { key: "nuevos" as const, label: "Nuevos", color: "var(--color-accent-blue)" },
  { key: "entregasPrevistas" as const, label: "Entrega prevista", color: "#0d9488" },
  { key: "entregados" as const, label: "Entregados", color: "var(--color-succes-primary)" },
];

export function HomeProjectsChart({
  data,
  monthLabel,
  loading,
}: {
  data: DayProjectActivity[];
  monthLabel: string;
  loading: boolean;
}) {
  const chartData = data.map((row) => ({
    dia: row.dayLabel,
    Nuevos: row.nuevos,
    "Entrega prevista": row.entregasPrevistas,
    Entregados: row.entregados,
  }));

  const hasActivity = data.some(
    (d) => d.nuevos > 0 || d.entregasPrevistas > 0 || d.entregados > 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyectos del mes</CardTitle>
        <CardDescription className="capitalize">
          Actividad diaria · {monthLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[320px] w-full min-w-0">
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando gráfico…</p>
        ) : !hasActivity ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              Sin actividad registrada este mes. Al crear proyectos, fijar fechas de entrega o marcar
              entregas, verás las líneas aquí.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Legend />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
