"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { useLocale } from "@/contexts/LocaleContext";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { getSocket } from "@/lib/socket-client";
import { Toaster } from "@/components/ui/sonner";
import {
  Users,
  AlertTriangle,
  Clock,
  ClipboardList,
  Briefcase,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

interface OperatorStats {
  periodo: string;
  ventanaActiva: {
    nombre: string;
    hora_fin: string | null;
    activa: boolean;
    porcentajeAvance: number;
  };
  kpis: {
    totalDocentes: number;
    docentesAtendidos: number;
    asignacionesRealizadas: number;
    conflictosPendientes: number;
  };
  listaConflictos: any[];
}

export default function DashboardOperador() {
  const { periodoSeleccionado } = usePeriodo();
  const { t } = useLocale();
  const [data, setData] = useState<OperatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name: string; rol: string } | null>(null);

  useEffect(() => {
    fetchUserInfo();
    if (periodoSeleccionado?.id_periodo) {
      fetchStats();
      const socket = getSocket();
      socket.on("horario-actualizado", fetchStats);
      socket.on("nuevo_conflicto", fetchStats);
      return () => {
        socket.off("horario-actualizado", fetchStats);
        socket.off("nuevo_conflicto", fetchStats);
      };
    }
  }, [periodoSeleccionado?.id_periodo]);

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
      const res = await fetch(`/api/dashboard/stats?id_periodo=${periodoSeleccionado?.id_periodo}`);
      const stats = await res.json();
      setData(stats);
    } catch {
      console.error("Error al cargar stats");
    } finally {
      setLoading(false);
    }
  };

  if (!periodoSeleccionado) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-card rounded-xl border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-card rounded-xl border border-border" />
          <div className="h-32 bg-card rounded-xl border border-border" />
          <div className="h-32 bg-card rounded-xl border border-border" />
        </div>
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const ventana = data?.ventanaActiva;
  const pctDocentes =
    kpis && kpis.totalDocentes > 0
      ? Math.round((kpis.docentesAtendidos / kpis.totalDocentes) * 100)
      : 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-6 w-full max-w-6xl mx-auto overflow-x-hidden">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
              {userInfo?.name?.substring(0, 1) || "O"}
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">
              ¡Hola, {userInfo?.name || "Operador"}!
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Panel de Operaciones - {data?.periodo}
              </p>
            </div>
          </div>
        </div>

        {ventana?.activa && ventana.hora_fin && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-lg">
            <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-0.5">
                Ventana Activa
              </p>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-500 tabular-nums leading-none">
                <CountdownTimer horaFin={ventana.hora_fin} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Gestión de Ventanas */}
        <Link
          href="/dashboard/catalogos?tab=ventanas"
          className="p-4 bg-card rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-sm flex flex-col group hover:border-purple-400 dark:hover:border-purple-700 transition-all bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Ventanas de Tiempo</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Control de acceso</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Administra los plazos en los que los docentes pueden interactuar con el sistema.
          </p>
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Gestionar ventanas <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>

        {/* Disponibilidad */}
        <Link
          href="/dashboard/disponibilidad"
          className="p-4 bg-card rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm flex flex-col group hover:border-indigo-400 dark:hover:border-indigo-700 transition-all bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Disponibilidad Docente</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Revisión de horarios</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Verifica qué docentes han registrado su disponibilidad para el semestre.
          </p>
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Ver disponibilidades <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>

        {/* Asignación de Carga */}
        <Link
          href="/dashboard/carga-lectiva-asignacion"
          className="p-4 bg-card rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm flex flex-col group hover:border-blue-400 dark:hover:border-blue-700 transition-all bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Asignación de Carga</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Gestión principal</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Módulo central para asignar cursos y horarios a los docentes disponibles.
          </p>
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Entrar al módulo <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>
      </div>

      {/* Indicadores Operativos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progreso de Atención */}
        <div className="dashboard-card p-5 flex flex-col justify-center border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avance de Atención</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{kpis?.docentesAtendidos || 0}</span>
            <span className="text-sm text-muted-foreground font-medium">/ {kpis?.totalDocentes || 0} docentes</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-emerald-700 dark:text-emerald-400">Progreso total</span>
              <span>{pctDocentes}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, pctDocentes)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Asignaciones Totales */}
        <div className="dashboard-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Carga Asignada</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">{kpis?.asignacionesRealizadas || 0}</span>
            <span className="text-sm text-muted-foreground font-medium">bloques de horario</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Total de asignaciones creadas en este semestre.
          </p>
        </div>

        {/* Conflictos */}
        <div className="dashboard-card p-5 flex flex-col justify-center border-rose-100 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 relative overflow-hidden">
          {(kpis?.conflictosPendientes ?? 0) > 0 && (
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <AlertTriangle className="h-24 w-24 text-rose-500" />
            </div>
          )}
          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-2">
              <AlertTriangle className={(kpis?.conflictosPendientes ?? 0) > 0 ? "h-4 w-4 text-rose-600 animate-pulse" : "h-4 w-4 text-muted-foreground"} />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Conflictos Activos</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className={`text-3xl font-black ${(kpis?.conflictosPendientes ?? 0) > 0 ? "text-rose-600 dark:text-rose-500" : "text-muted-foreground"}`}>
              {kpis?.conflictosPendientes || 0}
            </span>
            <span className="text-sm text-muted-foreground font-medium">pendientes de revisión</span>
          </div>
          {(kpis?.conflictosPendientes ?? 0) > 0 ? (
            <Link href="/dashboard/reportes" className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-3 py-1.5 rounded-md inline-flex self-start items-center gap-1 hover:bg-rose-200 transition-colors">
              Resolver conflictos &rarr;
            </Link>
          ) : (
            <p className="text-[11px] text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Todo en orden
            </p>
          )}
        </div>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
