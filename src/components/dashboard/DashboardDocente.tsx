"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { Toaster } from "@/components/ui/sonner";
import {
  Clock,
  Grid3X3,
  FileText,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

interface DocenteStats {
  periodo: string;
  kpis: {
    horasLectivas: number;
    horasNoLectivas: number;
    horasTotales: number;
    cantidadCursos: number;
    minHorasLectivas: number;
    maxHorasLectivas: number;
  };
  alertas: {
    sinDisponibilidad: boolean;
    declaracionesPendientes: boolean;
    faltaCargaLectiva: boolean;
  };
}

export default function DashboardDocente() {
  const { periodoSeleccionado } = usePeriodo();
  const [data, setData] = useState<DocenteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name: string; rol: string } | null>(null);

  useEffect(() => {
    fetchUserInfo();
    if (periodoSeleccionado?.id_periodo) {
      fetchStats();
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
      const res = await fetch(`/api/dashboard/stats-docente?id_periodo=${periodoSeleccionado?.id_periodo}`);
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
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
      <div className="space-y-4 animate-pulse max-w-6xl mx-auto">
        <div className="h-16 bg-card rounded-xl border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-card rounded-xl border border-border" />
          <div className="h-32 bg-card rounded-xl border border-border" />
          <div className="h-32 bg-card rounded-xl border border-border" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const alertas = data?.alertas;
  
  const pctLectivas = kpis && kpis.maxHorasLectivas > 0 
    ? Math.min(100, Math.round((kpis.horasLectivas / kpis.maxHorasLectivas) * 100)) 
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-6 w-full max-w-6xl mx-auto overflow-x-hidden">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
              {userInfo?.name?.substring(0, 1) || "D"}
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight leading-none">
              ¡Hola, {userInfo?.name || "Docente"}!
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Portal Docente - {data?.periodo}
              </p>
            </div>
          </div>
        </div>
        
        {/* Alertas Rápidas */}
        <div className="flex flex-col gap-2">
          {alertas?.sinDisponibilidad && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg text-[11px] font-bold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Aún no registras tu disponibilidad</span>
            </div>
          )}
          {alertas?.faltaCargaLectiva && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg text-[11px] font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span>Carga lectiva por debajo del mínimo</span>
            </div>
          )}
        </div>
      </div>

      {/* Indicadores Operativos (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carga Lectiva */}
        <div className="dashboard-card p-5 flex flex-col justify-center border-blue-100 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Carga Lectiva</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-blue-600 dark:text-blue-500">{kpis?.horasLectivas || 0}</span>
            <span className="text-sm text-muted-foreground font-medium">/ {kpis?.maxHorasLectivas || 0} hrs</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-blue-700 dark:text-blue-400">Progreso Asignado</span>
              <span>{pctLectivas}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, pctLectivas)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Carga No Lectiva */}
        <div className="dashboard-card p-5 flex flex-col justify-center border-purple-100 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Carga No Lectiva</h3>
            </div>
            {alertas?.declaracionesPendientes && (
              <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Pendiente</span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-500">{kpis?.horasNoLectivas || 0}</span>
            <span className="text-sm text-muted-foreground font-medium">horas</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 font-medium">
            Total de horas declaradas en investigación, admin, etc.
          </p>
        </div>

        {/* Resumen General */}
        <div className="dashboard-card p-5 flex flex-col justify-center border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resumen Académico</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{kpis?.horasTotales || 0}</span>
            <span className="text-sm text-muted-foreground font-medium">hrs totales</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-2 py-1 rounded w-max">
            <CalendarDays className="h-3.5 w-3.5" />
            {kpis?.cantidadCursos || 0} Cursos Asignados
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Disponibilidad */}
        <Link 
          href="/dashboard/disponibilidad"
          className="p-4 bg-card rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-sm flex flex-col group hover:border-indigo-400 dark:hover:border-indigo-700 transition-all hover:bg-muted/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Mi Disponibilidad</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Horarios posibles</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Define en qué horas de la semana tienes disponibilidad para impartir clases.
          </p>
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Editar disponibilidad <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>

        {/* Declaración de Carga Horaria */}
        <Link 
          href="/dashboard/carga-horaria"
          className="p-4 bg-card rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-sm flex flex-col group hover:border-purple-400 dark:hover:border-purple-700 transition-all hover:bg-muted/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Carga Horaria</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Declaración oficial</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Completa y envía tu declaración de carga lectiva y no lectiva para su aprobación.
          </p>
          <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Ir a declaración <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>

        {/* Mi Horario */}
        <Link 
          href="/dashboard/horarios/mi-horario"
          className="p-4 bg-card rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm flex flex-col group hover:border-emerald-400 dark:hover:border-emerald-700 transition-all hover:bg-muted/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Mi Horario</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Horario asignado</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Visualiza y descarga el horario oficial que se te ha asignado para este semestre.
          </p>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Ver mi horario <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
