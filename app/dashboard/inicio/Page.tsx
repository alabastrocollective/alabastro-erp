"use client";

import { useCallback, useEffect, useState } from "react";
import { startOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  getDashboardSummary,
  getHomeCalendarEvents,
  getMonthProjectActivity,
  getProjectsInProgress,
  type DashboardSummary,
  type DayProjectActivity,
  type HomeCalendarEvent,
  type ProjectInProgressItem,
} from "~/services/dashboardService";
import { formatUsd } from "~/lib/utils";
import { toast } from "sonner";
import { HomeProjectsChart } from "~/dashboard/inicio/HomeProjectsChart";
import { HomeProjectsInProgress } from "~/dashboard/inicio/HomeProjectsInProgress";
import { HomeMonthCalendar } from "~/dashboard/inicio/HomeMonthCalendar";

export default function InicioPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<DayProjectActivity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<HomeCalendarEvent[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [inProgress, setInProgress] = useState<ProjectInProgressItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingInProgress, setLoadingInProgress] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  const loadSummaryAndChart = useCallback(async () => {
    setLoadingSummary(true);
    setLoadingActivity(true);
    setLoadingInProgress(true);
    const [summaryRes, activityRes, progressRes] = await Promise.all([
      getDashboardSummary(),
      getMonthProjectActivity(),
      getProjectsInProgress(),
    ]);
    if (summaryRes.error) toast.error(summaryRes.error.message);
    if (activityRes.error) toast.error(activityRes.error.message);
    if (progressRes.error) toast.error(progressRes.error.message);
    setSummary(summaryRes.data);
    setActivity(activityRes.data);
    setInProgress(progressRes.data);
    setLoadingSummary(false);
    setLoadingActivity(false);
    setLoadingInProgress(false);
  }, []);

  const loadCalendar = useCallback(async (month: Date) => {
    setLoadingCalendar(true);
    const { data, error } = await getHomeCalendarEvents(month);
    if (error) toast.error(error.message);
    setCalendarEvents(data);
    setLoadingCalendar(false);
  }, []);

  useEffect(() => {
    void loadSummaryAndChart();
  }, [loadSummaryAndChart]);

  useEffect(() => {
    void loadCalendar(calendarMonth);
  }, [calendarMonth, loadCalendar]);

  if (loadingSummary && !summary) {
    return <p className="text-muted-foreground">Cargando resumen…</p>;
  }

  if (!summary) {
    return <p className="text-muted-foreground">No se pudo cargar el resumen.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
        <p className="text-muted-foreground capitalize">
          Resumen de {summary.monthLabel} · montos en USD
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos del mes</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatUsd(summary.ingresosUsd)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Suma de movimientos tipo ingreso.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Egresos del mes</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatUsd(summary.egresosUsd)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Suma de movimientos tipo egreso.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Proyectos en curso</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{summary.proyectosEnCurso}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Presupuesto aceptado, producción o revisión.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entregados este mes</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{summary.proyectosEntregadosMes}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Estado entregado con fecha en el mes.
          </CardContent>
        </Card>
      </div>

      <HomeProjectsChart
        data={activity}
        monthLabel={summary.monthLabel}
        loading={loadingActivity}
      />

      <HomeProjectsInProgress items={inProgress} loading={loadingInProgress} />

      <HomeMonthCalendar
        viewMonth={calendarMonth}
        onViewMonthChange={setCalendarMonth}
        events={calendarEvents}
        loading={loadingCalendar}
      />
    </div>
  );
}
