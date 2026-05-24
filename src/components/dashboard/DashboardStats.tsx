"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { DIAS_SEMANA, HORAS_MAPA_CALOR, formatRangoHora } from "@/lib/dashboard-labels";
import { useLocale } from "@/contexts/LocaleContext";
import {
  FileText,
  FlaskConical,
  GraduationCap,
  BarChart3,
} from "lucide-react";

interface StatsData {
  periodo: string;
  ventanaActiva: {
    nombre: string;
    hora_fin: string | null;
    hora_inicio?: string;
    porcentajeAvance: number;
  };
  kpis: {
    totalDocentes: number;
    docentesAtendidos: number;
    asignacionesRealizadas: number;
    conflictosPendientes: number;
    porcentajeAvance: number;
  };
  avanceCategoria: { name: string; value: number; total: number; percent: number }[];
  ocupacionTeoria: { nombre: string; porcentaje: number }[];
  ocupacionLaboratorios: { nombre: string; porcentaje: number }[];
  mapaCalor: { dia: number; hora: string; valor: number }[];
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-500", className)}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function VerticalBarChart({
  data,
  emptyLabel,
}: {
  data: { nombre: string; porcentaje: number }[];
  emptyLabel: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">{emptyLabel}</p>
    );
  }

  return (
    <div className="flex items-end justify-center gap-6 h-36 pt-2">
      {data.map((item, i) => (
        <div
          key={`${item.nombre}-${i}`}
          className="flex flex-col items-center gap-1.5 flex-1 max-w-[64px]"
        >
          <span className="text-xs font-bold tabular-nums">
            {item.porcentaje > 0 ? `${item.porcentaje}%` : "—"}
          </span>
          <div className="relative w-10 h-28 bg-muted rounded-t-md flex items-end">
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: `${Math.max(item.porcentaje, 3)}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
            {item.nombre}
          </span>
        </div>
      ))}
    </div>
  );
}

function heatmapLevel(valor: number): "baja" | "media" | "alta" {
  if (valor <= 2) return "baja";
  if (valor <= 5) return "media";
  return "alta";
}

const HEATMAP_STYLES = {
  baja: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  alta: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

interface DashboardStatsProps {
  id_periodo: number;
  periodos: { id_periodo: number; codigo?: string; nombre: string }[];
  selectedPeriodo: string;
  onPeriodoChange: (v: string) => void;
}

export function DashboardStats({
  id_periodo,
  periodos,
  selectedPeriodo,
}: DashboardStatsProps) {
  const { t } = useLocale();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id_periodo && !isNaN(id_periodo)) {
      fetchStats();
      const cleanup = setupSocket();
      return cleanup;
    }
  }, [id_periodo]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/dashboard/stats?id_periodo=${id_periodo}`);
      const stats = await res.json();
      setData(stats);
    } catch {
      console.error("Error al cargar stats");
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    socket.on("horario-actualizado", fetchStats);
    socket.on("nuevo_conflicto", fetchStats);
    return () => {
      socket.off("horario-actualizado", fetchStats);
      socket.off("nuevo_conflicto", fetchStats);
    };
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-14 dashboard-card" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 dashboard-card" />
          ))}
        </div>
        <div className="h-48 dashboard-card" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const ventana = data?.ventanaActiva;
  const pctGeneral = ventana?.porcentajeAvance ?? kpis?.porcentajeAvance ?? 0;
  const pctDocentes =
    kpis && kpis.totalDocentes > 0
      ? Math.round((kpis.docentesAtendidos / kpis.totalDocentes) * 100)
      : 0;

  const getCalorValor = (dia: number, hora: string) => {
    const cell = data?.mapaCalor?.find(
      (c) => c.dia === dia && (c.hora === hora || c.hora.startsWith(hora))
    );
    return cell?.valor ?? 0;
  };

  const categorias =
    data?.avanceCategoria?.length ? data.avanceCategoria : [];

  const periodoCodigo =
    periodos.find((p) => p.id_periodo.toString() === selectedPeriodo)?.codigo ||
    "—";

  const reportLinks = [
    { href: "/dashboard/reportes", label: t("reportByRoom"), icon: FileText },
    { href: "/dashboard/reportes", label: t("reportByLab"), icon: FlaskConical },
    { href: "/dashboard/reportes", label: t("reportByTeacher"), icon: GraduationCap },
    { href: "/dashboard/reportes", label: t("reportManagement"), icon: BarChart3 },
  ];

  return (
    <div className="space-y-3 w-full">
      {/* Encabezado compacto */}
      <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-base font-bold tracking-tight">{t("dashboardTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashboardSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted font-medium">
            {t("period")}: <strong className="text-primary">{periodoCodigo}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            {t("currentWindow")}:{" "}
            <strong>{ventana?.nombre || t("noWindow")}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive font-semibold tabular-nums">
            {t("timeRemaining")}: <CountdownTimer horaFin={ventana?.hora_fin} />
          </span>
        </div>
      </div>

      {/* KPIs — 4 columnas en 1920 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="dashboard-card p-4">
          <p className="kpi-label">{t("kpiWindow")}</p>
          <p className="text-sm font-bold text-primary mt-1 truncate">
            {ventana?.nombre || t("noWindow")}
          </p>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{t("kpiProgress")}</span>
            <span className="font-semibold tabular-nums">{pctGeneral}%</span>
          </div>
          <div className="mt-1.5">
            <ProgressBar percent={pctGeneral} />
          </div>
        </div>

        <div className="dashboard-card p-4">
          <p className="kpi-label">{t("kpiTeachers")}</p>
          <p className="kpi-value mt-1">
            {kpis?.docentesAtendidos ?? 0}
            <span className="text-base text-muted-foreground font-normal">
              {" "}/ {kpis?.totalDocentes ?? 0}
            </span>
          </p>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>{t("kpiResponseRate")}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {pctDocentes}%
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar percent={pctDocentes} className="!bg-emerald-500" />
          </div>
        </div>

        <div className="dashboard-card p-4">
          <p className="kpi-label">{t("kpiAssignments")}</p>
          <p className="kpi-value mt-1 text-primary">
            {kpis?.asignacionesRealizadas ?? 0}
          </p>
        </div>

        <div className="dashboard-card p-4">
          <p className="kpi-label">{t("kpiConflicts")}</p>
          <p className="kpi-value mt-1 text-destructive">
            {kpis?.conflictosPendientes ?? 0}
          </p>
          <div className="mt-2 flex justify-end">
            <Link
              href="/dashboard/reportes"
              className="text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md hover:bg-destructive/15 transition-colors"
            >
              {t("kpiView")} →
            </Link>
          </div>
        </div>
      </div>

      {/* Avance por categoría */}
      {categorias.length > 0 && (
        <div className="dashboard-card p-4">
          <h2 className="text-sm font-bold mb-3">{t("categoryProgress")}</h2>
          <div className="space-y-2">
            {categorias.map((cat) => (
              <div
                key={cat.name}
                className="grid grid-cols-[minmax(120px,180px)_1fr_auto] items-center gap-3"
              >
                <span className="text-xs font-medium truncate">{cat.name}</span>
                <ProgressBar percent={cat.percent} />
                <span className="text-xs font-bold tabular-nums w-14 text-right">
                  {cat.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="dashboard-card p-4">
          <h2 className="text-sm font-bold text-primary mb-1">{t("theoryOccupancy")}</h2>
          <VerticalBarChart
            data={data?.ocupacionTeoria ?? []}
            emptyLabel={t("noData")}
          />
        </div>
        <div className="dashboard-card p-4">
          <h2 className="text-sm font-bold text-primary mb-1">{t("labOccupancy")}</h2>
          <VerticalBarChart
            data={data?.ocupacionLaboratorios ?? []}
            emptyLabel={t("noData")}
          />
        </div>
      </div>

      {/* Mapa de calor + reportes rápidos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="dashboard-card p-4 xl:col-span-2 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-primary">{t("heatmapTitle")}</h2>
            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-emerald-500/40" />
                {t("heatLow")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-amber-500/40" />
                {t("heatMid")}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-rose-500/40" />
                {t("heatHigh")}
              </span>
            </div>
          </div>

          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 font-medium text-muted-foreground w-28">
                  Hora
                </th>
                {[0, 1, 2, 3, 4].map((d) => (
                  <th key={d} className="text-center py-2 font-medium">
                    {DIAS_SEMANA[d]?.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS_MAPA_CALOR.map((hora) => (
                <tr key={hora} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 pr-2 text-muted-foreground whitespace-nowrap">
                    {formatRangoHora(hora)}
                  </td>
                  {[0, 1, 2, 3, 4].map((dia) => {
                    const valor = getCalorValor(dia, hora);
                    const nivel = heatmapLevel(valor);
                    return (
                      <td key={dia} className="py-1.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1 rounded border text-[11px] font-bold tabular-nums",
                            HEATMAP_STYLES[nivel]
                          )}
                        >
                          {valor > 0 ? valor : "—"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-card p-4 bg-primary text-primary-foreground border-primary">
          <h2 className="text-sm font-bold">{t("quickReports")}</h2>
          <p className="text-[11px] opacity-80 mt-1 mb-3">{t("quickReportsDesc")}</p>
          <div className="space-y-1.5">
            {reportLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 px-3 py-2 rounded-lg text-xs transition-colors"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
