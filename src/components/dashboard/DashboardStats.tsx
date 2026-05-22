"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { DIAS_SEMANA, HORAS_MAPA_CALOR, formatRangoHora } from "@/lib/dashboard-labels";

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

const BLUE_SHADES = ["#1a237e", "#3949ab", "#5c6bc0", "#9fa8da"];
const GREEN_SHADES = ["#059669", "#10b981", "#6ee7b7", "#a7f3d0"];

function ProgressBar({
  percent,
  colorClass = "bg-[#1a237e]",
}: {
  percent: number;
  colorClass?: string;
}) {
  return (
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", colorClass)}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function VerticalBarChart({
  data,
  colors,
  emptyLabel,
}: {
  data: { nombre: string; porcentaje: number }[];
  colors: string[];
  emptyLabel: string;
}) {
  const items =
    data.length > 0
      ? data
      : [
          { nombre: "—", porcentaje: 0 },
          { nombre: "—", porcentaje: 0 },
          { nombre: "—", porcentaje: 0 },
        ];

  return (
    <div className="flex items-end justify-center gap-8 h-52 pt-4">
      {items.map((item, i) => (
        <div key={`${item.nombre}-${i}`} className="flex flex-col items-center gap-2 flex-1 max-w-[72px]">
          <span className="text-sm font-bold text-slate-700 tabular-nums">
            {item.porcentaje > 0 ? `${item.porcentaje}%` : "—"}
          </span>
          <div className="relative w-14 h-40 bg-slate-100 rounded-t-lg flex items-end">
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${Math.max(item.porcentaje, 4)}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-600">{item.nombre}</span>
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-xs text-slate-400 self-center">{emptyLabel}</p>
      )}
    </div>
  );
}

function heatmapLevel(valor: number): "baja" | "media" | "alta" {
  if (valor <= 2) return "baja";
  if (valor <= 5) return "media";
  return "alta";
}

const HEATMAP_STYLES = {
  baja: "bg-emerald-100 text-emerald-700 border-emerald-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  alta: "bg-rose-100 text-rose-600 border-rose-200",
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
  onPeriodoChange,
}: DashboardStatsProps) {
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
    } catch (error) {
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
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-100" />
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

  const avanceFallback = [
    { name: "Principal Nombrado", value: 0, total: 0, percent: 0 },
    { name: "Principal Contratado", value: 0, total: 0, percent: 0 },
    { name: "Asociado Nombrado", value: 0, total: 0, percent: 0 },
    { name: "Asociado Contratado", value: 0, total: 0, percent: 0 },
    { name: "Auxiliar Nombrado", value: 0, total: 0, percent: 0 },
    { name: "Auxiliar Contratado", value: 0, total: 0, percent: 0 },
    { name: "Jefe de Práctica", value: 0, total: 0, percent: 0 },
  ];

  const categorias = data?.avanceCategoria?.length
    ? data.avanceCategoria
    : avanceFallback;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a237e] tracking-tight">
            Consola de Control General
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Escuela de Ingeniería de Sistemas — Universidad Nacional de Trujillo
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-white border border-slate-200 rounded-xl shadow-sm divide-x divide-slate-200 text-sm">
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="text-slate-500">Período</span>
            <select
              value={selectedPeriodo}
              onChange={(e) => onPeriodoChange(e.target.value)}
              className="font-bold text-[#1a237e] bg-transparent outline-none cursor-pointer"
            >
              {periodos.map((p) => (
                <option key={p.id_periodo} value={p.id_periodo}>
                  {p.codigo || p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="px-4 py-3">
            <span className="text-slate-500">Ventana actual: </span>
            <span className="font-bold text-[#1a237e]">{ventana?.nombre || "—"}</span>
          </div>
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="text-slate-500">Tiempo restante:</span>
            <CountdownTimer horaFin={ventana?.hora_fin} />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Ventana actual
          </p>
          <p className="text-xl font-bold text-[#1a237e] mt-2 leading-tight">
            {ventana?.nombre || "Sin ventana"}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Progreso general</span>
            <span className="font-bold text-slate-700">{pctGeneral}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar percent={pctGeneral} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Docentes atendidos
          </p>
          <p className="text-xl font-bold text-[#1a237e] mt-2 tabular-nums">
            {kpis?.docentesAtendidos ?? 0} / {kpis?.totalDocentes ?? 0}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Tasa de respuesta</span>
            <span className="font-bold text-slate-700">{pctDocentes}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar percent={pctDocentes} colorClass="bg-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Asignaciones hoy
          </p>
          <p className="text-xl font-bold text-[#1a237e] mt-2 tabular-nums">
            {kpis?.asignacionesRealizadas ?? 0}
          </p>
          <p className="mt-6 text-xs font-semibold text-emerald-600">↑ 15% vs ayer</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Cruces pendientes
          </p>
          <p className="text-3xl font-bold text-rose-500 mt-2 tabular-nums">
            {kpis?.conflictosPendientes ?? 0}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">Conflictos</span>
            <Link
              href="/dashboard/reportes"
              className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Ver
            </Link>
          </div>
        </div>
      </div>

      {/* Avance por categoría */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#1a237e] mb-6">
          Avance de Selección de Horarios por Categoría
        </h2>
        <div className="space-y-4">
          {categorias.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-44 shrink-0">{cat.name}</span>
              <div className="flex-1">
                <ProgressBar
                  percent={cat.percent}
                  colorClass={
                    cat.percent === 100
                      ? "bg-[#1a237e]"
                      : cat.percent > 0
                        ? "bg-[#3949ab]"
                        : "bg-slate-200"
                  }
                />
              </div>
              <div className="flex items-center gap-3 shrink-0 text-sm tabular-nums">
                <span className="text-slate-500 font-medium">
                  {cat.value}/{cat.total}
                </span>
                <span className="font-bold text-slate-800 w-10 text-right">{cat.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos de ocupación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-[#1a237e] mb-2">
            Ocupación de Aulas de Teoría
          </h2>
          <VerticalBarChart
            data={data?.ocupacionTeoria ?? []}
            colors={BLUE_SHADES}
            emptyLabel="Sin datos de aulas"
          />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-[#1a237e] mb-2">
            Ocupación de Laboratorios
          </h2>
          <VerticalBarChart
            data={data?.ocupacionLaboratorios ?? []}
            colors={GREEN_SHADES}
            emptyLabel="Sin datos de laboratorios"
          />
        </div>
      </div>

      {/* Mapa de calor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-base font-bold text-[#1a237e]">
            Mapa de Calor: Ocupación Horaria Global
          </h2>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300" />
              Baja (1-2)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-300" />
              Media (3-5)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-200 border border-rose-300" />
              Alta (6+)
            </span>
          </div>
        </div>

        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-2 font-semibold text-slate-500 w-36">Hora</th>
              {[1, 2, 3, 4, 5].map((d) => (
                <th key={d} className="text-center py-3 px-2 font-semibold text-slate-600">
                  {DIAS_SEMANA[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HORAS_MAPA_CALOR.map((hora) => (
              <tr key={hora} className="border-b border-slate-50 last:border-0">
                <td className="py-3 px-2 text-slate-500 font-medium whitespace-nowrap">
                  {formatRangoHora(hora)}
                </td>
                {[1, 2, 3, 4, 5].map((dia) => {
                  const valor = getCalorValor(dia, hora);
                  const nivel = heatmapLevel(valor);
                  return (
                    <td key={dia} className="py-3 px-2 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md border text-xs font-bold tabular-nums",
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
  );
}
