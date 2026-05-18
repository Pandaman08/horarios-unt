"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { 
  Users, 
  CalendarCheck, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { KpiConflictosPendientes } from "./KpiConflictosPendientes";

interface StatsData {
  kpis: {
    totalDocentes: number;
    asignacionesRealizadas: number;
    conflictosPendientes: number;
    porcentajeAvance: number;
  };
  avanceCategoria: any[];
  ocupacionAmbientes: any[];
  cargaDocente: any[];
}

const COLORS = ["#003366", "#005599", "#D4AF37", "#E5E7EB"];

export function DashboardStats({ id_periodo }: { id_periodo: number }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actividades, setActividades] = useState<any[]>([]);

  useEffect(() => {
    if (id_periodo && !isNaN(id_periodo)) {
      fetchStats();
      setupSocket();
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
    
    socket.on("horario-actualizado", (payload) => {
      fetchStats();
      if (payload && payload.mensaje) {
        setActividades(prev => [
          { id: Date.now(), mensaje: payload.mensaje, fecha: new Date(), tipo: 'info' },
          ...prev.slice(0, 9)
        ]);
      }
    });

    socket.on("nuevo_conflicto", (payload) => {
      if (payload && payload.descripcion) {
        setActividades(prev => [
          { 
            id: payload.id_conflicto || Date.now(), 
            mensaje: `⚠️ Conflicto detectado: ${payload.descripcion}`, 
            fecha: payload.timestamp || new Date(),
            tipo: 'error'
          },
          ...prev.slice(0, 9)
        ]);
      }
    });

    return () => {
      socket.off("horario-actualizado");
      socket.off("nuevo_conflicto");
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-gray-50 rounded-[32px] border border-gray-100" />
        ))}
      </div>
    );
  }
  const kpis = [
    { 
      title: "Docentes", 
      value: data?.kpis.totalDocentes || 0, 
      icon: Users, 
      color: "from-[#003366] to-[#004488]",
      description: "Plana académica activa"
    },
    { 
      title: "Asignaciones", 
      value: data?.kpis.asignacionesRealizadas || 0, 
      icon: CalendarCheck, 
      color: "from-emerald-600 to-emerald-800",
      description: "Sesiones programadas"
    },
    { 
      title: "Conflictos", 
      value: data?.kpis.conflictosPendientes || 0, 
      icon: AlertTriangle, 
      color: "from-amber-500 to-amber-700",
      description: "Revisiones necesarias"
    },
    { 
      title: "Avance", 
      value: `${data?.kpis.porcentajeAvance || 0}%`, 
      icon: TrendingUp, 
      color: "from-indigo-600 to-indigo-800",
      description: "Progreso del semestre"
    },
  ];

  return (
    <div className="space-y-8 lg:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="group overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-2">
            <CardContent className="p-8 relative">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${kpi.color} shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-500`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Live</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black tracking-tight text-gray-900">{kpi.value}</h3>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{kpi.title}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">{kpi.description}</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Principal: Ocupación */}
        <Card className="lg:col-span-2 rounded-[40px] border border-gray-100 shadow-2xl shadow-blue-900/5 bg-white p-8">
          <CardHeader className="px-0 pt-0 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#003366]" />
                  <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Ocupación de Ambientes</CardTitle>
                </div>
                <CardDescription className="text-base text-gray-400 font-bold uppercase tracking-widest text-[10px]">Distribución de carga por espacio físico</CardDescription>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="inline-flex items-center bg-white border-none shadow-sm font-black text-[9px] px-3 py-1 rounded-lg">HORAS / SEMANA</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.ocupacionAmbientes || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#003366" stopOpacity={1} />
                    <stop offset="100%" stopColor="#005599" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="nombre" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 12}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px'}}
                />
                <Bar dataKey="cantidad" radius={[10, 10, 0, 0]} barSize={40} fill="url(#barGradient)">
                  {(data?.ocupacionAmbientes || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Actividad e Historial */}
        <div className="space-y-8">
          <Card className="rounded-[40px] border border-gray-100 shadow-2xl shadow-blue-900/5 bg-white p-8">
            <CardHeader className="px-0 pt-0 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-[#003366]" />
                  </div>
                  <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Actividad</CardTitle>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">En Vivo</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-6 overflow-y-auto max-h-[400px] pr-4 custom-scrollbar">
                {actividades.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-20 w-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-4">
                      <Activity className="h-10 w-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-bold max-w-[150px]">Sincronizando actualizaciones...</p>
                  </div>
                ) : (
                  actividades.map((act) => (
                    <div key={act.id} className="relative pl-6 pb-6 border-l-2 border-gray-50 last:pb-0">
                      <div className={cn(
                        "absolute -left-[5px] top-1 h-2 w-2 rounded-full",
                        act.tipo === 'error' ? "bg-red-500 ring-4 ring-red-50" : "bg-blue-500 ring-4 ring-blue-50"
                      )} />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-800 leading-snug">{act.mensaje}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 bg-[#003366] p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Resumen de Calidad</p>
                <h4 className="text-lg font-black tracking-tight">Cero Conflictos</h4>
                <p className="text-xs text-blue-100/60 font-medium">No se detectan cruces horitontales.</p>
              </div>
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
