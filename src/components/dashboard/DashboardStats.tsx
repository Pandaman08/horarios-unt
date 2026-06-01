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
  BookOpen,
} from "lucide-react";

interface StatsData {
  periodo: string;
  ventanaActiva: {
    nombre: string;
    hora_fin: string | null;
    hora_inicio?: string;
    activa: boolean;
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
  ocupacionTeoria: { nombre: string; porcentaje: number; cantidad?: number }[];
  ocupacionLaboratorios: { nombre: string; porcentaje: number; cantidad?: number }[];
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
}: Readonly<{
  percent: number;
  className?: string;
}>) {
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
}: Readonly<{
  data: { nombre: string; porcentaje: number; cantidad?: number }[];
  emptyLabel: string;
}>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
          <span className="text-lg">📊</span>
        </div>
        <p className="text-xs font-medium">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div
          key={`${item.nombre}-${i}`}
          className="space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground truncate flex-1">
              {item.nombre}
            </span>
            <span className="text-xs font-bold text-primary tabular-nums ml-2">
              {item.porcentaje}%
            </span>
          </div>
          <div className="relative w-full h-5 bg-muted rounded-md overflow-hidden border border-border/50">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: `${Math.max(item.porcentaje, 5)}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
          </div>
          {item.cantidad !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              Asignaciones: {item.cantidad}
            </span>
          )}
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
  readonly id_periodo: number;
  readonly periodos: { id_periodo: number; codigo?: string; nombre: string }[];
  readonly selectedPeriodo: string;
}

export function DashboardStats({
  id_periodo,
  periodos,
  selectedPeriodo,
}: Readonly<DashboardStatsProps>) {
  const { t } = useLocale();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name: string; rol: string } | null>(null);

  useEffect(() => {
    fetchUserInfo();
    if (id_periodo && !Number.isNaN(id_periodo)) {
      fetchStats();
      const cleanup = setupSocket();
      return cleanup;
    }
  }, [id_periodo]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const user = await res.json();
      setUserInfo(user);
    } catch {
      console.error("Error al cargar info del usuario");
    }
  };

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

  const reportLinks = [
    { href: "/dashboard/carga-lectiva-asignacion", label: "Asignar Carga Lectiva", icon: BookOpen },
    { href: "/dashboard/reportes", label: t("reportByRoom"), icon: FileText },
    { href: "/dashboard/reportes", label: t("reportByLab"), icon: FlaskConical },
    { href: "/dashboard/reportes", label: t("reportByTeacher"), icon: GraduationCap },
    { href: "/dashboard/reportes", label: t("reportManagement"), icon: BarChart3 },
  ];

  return (
    <div className="space-y-3 w-full">
      {/* Encabezado compacto */}
      <div className="dashboard-card flex flex-col md:flex-row md:flex-wrap items-start md:items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-base font-bold tracking-tight">{t("dashboardTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userInfo?.name && userInfo?.rol ? `${userInfo.name} • ${userInfo.rol}` : t("dashboardSubtitle")}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-2 text-xs w-full md:w-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted font-medium">
            {t("period")}: <strong className="text-primary">{data?.periodo || "—"}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            {t("currentWindow")}:{" "}
            <strong className={data?.ventanaActiva?.activa ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
              {data?.ventanaActiva?.nombre || t("noWindow")}
            </strong>
          </span>
          {data?.ventanaActiva?.activa && data?.ventanaActiva?.hora_fin && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive font-semibold tabular-nums">
              {t("timeRemaining")}: <CountdownTimer horaFin={data.ventanaActiva.hora_fin} />
            </span>
          )}
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
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-primary">{t("heatmapTitle")}</h2>
            <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                <span className="hidden sm:inline">{t("heatLow")}</span>
                <span className="sm:hidden">Baja</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500/60" />
                <span className="hidden sm:inline">{t("heatMid")}</span>
                <span className="sm:hidden">Media</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500/60" />
                <span className="hidden sm:inline">{t("heatHigh")}</span>
                <span className="sm:hidden">Alta</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground w-20">
                    Hora
                  </th>
                  {[0, 1, 2, 3, 4, 5].map((d) => (
                    <th key={d} className="text-center py-2.5 px-1 font-semibold text-muted-foreground">
                      {DIAS_SEMANA[d]?.slice(0, 3).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORAS_MAPA_CALOR.map((hora, idx) => (
                  <tr key={hora} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="py-2 px-3 text-muted-foreground font-medium whitespace-nowrap">
                      {formatRangoHora(hora)}
                    </td>
                    {[0, 1, 2, 3, 4, 5].map((dia) => {
                      const valor = getCalorValor(dia, hora);
                      const nivel = heatmapLevel(valor);
                      return (
                        <td key={dia} className="py-2 px-1 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center min-w-[2rem] h-7 px-1 rounded-md border font-bold tabular-nums text-[10px] transition-colors",
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
        </div>

        <div className="dashboard-card p-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary">
          <h2 className="text-sm font-bold mb-1">{t("quickReports")}</h2>
          <p className="text-[11px] opacity-90 mb-3 leading-relaxed">{t("quickReportsDesc")}</p>
          <div className="space-y-2">
            {reportLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/10 hover:border-white/30 text-primary-foreground transition-all hover:translate-x-1"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
