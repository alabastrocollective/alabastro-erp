"use client";

import { useMemo } from "react";
import { Link } from "react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { HomeCalendarEvent } from "~/services/dashboardService";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const EVENT_STYLES = {
  entrega_proyecto: {
    label: "Entrega de proyecto",
    className: "bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200/80",
  },
  objetivo: {
    label: "Vencimiento de objetivo",
    className: "bg-amber-100 text-amber-950 border-amber-200 hover:bg-amber-200/80",
  },
} as const;

const MAX_EVENTS_PER_DAY = 3;

export function HomeMonthCalendar({
  viewMonth,
  onViewMonthChange,
  events,
  loading,
}: {
  viewMonth: Date;
  onViewMonthChange: (date: Date) => void;
  events: HomeCalendarEvent[];
  loading: boolean;
}) {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1, locale: es });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1, locale: es });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, HomeCalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const monthTitle = format(viewMonth, "MMMM yyyy", { locale: es });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Calendario</CardTitle>
          <CardDescription className="capitalize">
            Entregas de proyectos y vencimientos de objetivos · {monthTitle}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewMonthChange(startOfMonth(new Date()))}
          >
            Hoy
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onViewMonthChange(subMonths(viewMonth, 1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {(Object.keys(EVENT_STYLES) as (keyof typeof EVENT_STYLES)[]).map((kind) => (
            <span key={kind} className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "size-3 rounded-sm border",
                  kind === "entrega_proyecto" ? "bg-sky-200 border-sky-300" : "bg-amber-200 border-amber-300"
                )}
              />
              {EVENT_STYLES[kind].label}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <div className="grid min-w-[640px] grid-cols-7 border-b bg-muted/40">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="border-r px-2 py-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="grid min-w-[640px] grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate.get(key) ?? [];
              const inMonth = isSameMonth(day, viewMonth);
              const today = isToday(day);
              const visible = dayEvents.slice(0, MAX_EVENTS_PER_DAY);
              const hidden = dayEvents.length - visible.length;

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[100px] border-b border-r p-1.5 last:border-r-0",
                    !inMonth && "bg-muted/20 text-muted-foreground",
                    today && inMonth && "bg-secondary-blue/50"
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-right text-xs font-medium tabular-nums",
                      today && inMonth && "text-accent-blue"
                    )}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="space-y-0.5">
                    {loading && inMonth ? (
                      <span className="text-[10px] text-muted-foreground">…</span>
                    ) : (
                      <>
                        {visible.map((ev) => (
                          <Link
                            key={ev.id}
                            to={ev.href}
                            className={cn(
                              "block truncate rounded border px-1 py-0.5 text-[10px] leading-tight font-medium transition-colors",
                              EVENT_STYLES[ev.kind].className
                            )}
                            title={ev.title}
                          >
                            {ev.title}
                          </Link>
                        ))}
                        {hidden > 0 && (
                          <p className="text-[10px] text-muted-foreground px-0.5">+{hidden} más</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
