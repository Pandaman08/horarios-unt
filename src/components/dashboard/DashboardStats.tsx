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
  LineChart,
  Line,
  Legend,
  LabelList
} from "recharts";
import { 
  Users, 
  CalendarCheck, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  AlertCircle,
  Building2,
  Clock,
  CheckCircle2,
  Bell,
  FileText,
  MapPin,
  Laptop
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";

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
  tendenciasSemestre?: any[];
  listaConflictos?: any[];
  actividadesRecientes?: any[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

export function DashboardStats({ id_periodo }: { id_periodo: number }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actividades, setActividades] = useState<any[]>([
    { id: 1, mensaje: "Juan Pérez confirmó su horario en Aula 203", fecha: "Hace 15 min", tipo: 'success', icono: CheckCircle2, color: "text-green-500 bg-green-50" },
    { id: 2, mensaje: "María Gómez seleccionó Lab de Cómputo 101", fecha: "Hace 25 min", tipo: 'info', icono: Users, color: "text-purple-500 bg-purple-50" },
    { id: 3, mensaje: "Nueva ventana de atención: Auxiliares Nombrados", fecha: "Hace 1 hora", tipo: 'warning', icono: Clock, color: "text-amber-500 bg-amber-50" },
    { id: 4, mensaje: "Reporte de horarios generado", fecha: "Hace 2 horas", tipo: 'default', icono: FileText, color: "text-blue-500 bg-blue-50" },
    { id: 5, mensaje: "Conflicto detectado en Aula 101", fecha: "Hace 3 horas", tipo: 'error', icono: AlertTriangle, color: "text-red-500 bg-red-50" },
  ]);

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
      
      if (!stats.tendenciasSemestre) {
        stats.tendenciasSemestre = [
          { name: 'Sem 1', carga: 45 },
          { name: 'Sem 2', carga: 52 },
          { name: 'Sem 3', carga: 48 },
          { name: 'Sem 4', carga: 61 },
          { name: 'Sem 5', carga: 55 },
          { name: 'Sem 6', carga: 67 },
        ];
      }
      
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
    });

    socket.on("nuevo_conflicto", (payload) => {
      fetchStats();
    });

    return () => {
      socket.off("horario-actualizado");
      socket.off("nuevo_conflicto");
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-gray-50 rounded-xl border border-gray-100" />
        ))}
      </div>
    );
  }

  const kpis = [
    { title: "Docentes", value: data?.kpis.totalDocentes || 0, icon: Users, color: "bg-blue-50 text-blue-600", label: "Docentes Activos" },
    { title: "Asignaciones", value: data?.kpis.asignacionesRealizadas || 0, icon: CalendarCheck, color: "bg-green-50 text-green-600", label: "Horas Asignadas" },
    { title: "Conflictos", value: data?.kpis.conflictosPendientes || 0, icon: AlertTriangle, color: "bg-red-50 text-red-600", label: "Conflictos Críticos" },
    { title: "Avance", value: `${data?.kpis.porcentajeAvance || 0}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600", label: "Progreso Total" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Primera Fila: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center shrink-0", kpi.color)}>
                <kpi.icon className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-[26px] font-black text-gray-900 leading-none">{kpi.value}</span>
                <span className="text-[14px] font-bold text-gray-400 mt-1">{kpi.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segunda Fila: Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ocupación de Ambientes por Hora */}
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-[20px] font-black text-gray-900">Ocupación de Ambientes por Hora</CardTitle>
            <CardDescription className="text-[14px]">Distribución de carga por tipo de espacio</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.ocupacionAmbientes || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} barSize={40}>
                  {(data?.ocupacionAmbientes || []).map((entry, index) => {
                    let color = "#3b82f6"; // Predeterminado
                    if (entry.cantidad >= 15) color = "#ef4444"; // Alta
                    else if (entry.cantidad >= 10) color = "#f59e0b"; // Media
                    else if (entry.cantidad >= 5) color = "#10b981"; // Baja
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ocupación de Docentes (Ranking) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-[20px] font-black text-gray-900">Ocupación de Docentes</CardTitle>
            <CardDescription className="text-[14px]">Docentes con mayor carga horaria</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data?.cargaDocente && data.cargaDocente.length > 0 ? data.cargaDocente : [
                  { nombre: 'Cargando...', asignaciones: 0 }
                ]}
                margin={{ left: 10, right: 40, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="h" />
                <YAxis dataKey="nombre" type="category" hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                />
                <Bar dataKey="asignaciones" radius={[0, 6, 6, 0]} barSize={30}>
                  <LabelList dataKey="nombre" position="insideLeft" offset={10} style={{ fill: '#fff', fontWeight: 'bold', fontSize: '12px' }} />
                  {(data?.cargaDocente || []).map((entry, index) => {
                    let color = "#10b981"; 
                    if (entry.asignaciones >= 18) color = "#ef4444";
                    else if (entry.asignaciones >= 15) color = "#f59e0b";
                    else if (entry.asignaciones >= 10) color = "#3b82f6";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tercera Fila: Listas con diseño de alta fidelidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado de Ambientes con Barras de Progreso */}
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[20px] font-black text-gray-900">Estado de Ambientes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            {(data?.ocupacionAmbientes || []).slice(0, 4).map((amb, i) => {
              const porcentaje = Math.min(100, (amb.cantidad / 20) * 100);
              const colorClass = amb.cantidad >= 15 ? "bg-red-500" : amb.cantidad >= 10 ? "bg-amber-500" : "bg-green-500";
              const Icon = i % 2 === 0 ? Building2 : Laptop;
              const iconColor = amb.cantidad >= 15 ? "text-red-500" : amb.cantidad >= 10 ? "text-amber-500" : "text-green-500";
              const iconBg = amb.cantidad >= 15 ? "bg-red-50" : amb.cantidad >= 10 ? "bg-amber-50" : "bg-green-50";

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconBg)}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                      </div>
                      <div>
                        <p className="text-[16px] font-bold text-gray-800 leading-none">{amb.nombre}</p>
                        <p className="text-[12px] text-gray-400 mt-1">Capacidad estándar</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-black text-gray-900 leading-none">{amb.cantidad} hrs</p>
                      <p className="text-[12px] text-gray-400 mt-1">{Math.round(porcentaje)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", colorClass)} style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actividad Reciente con Iconos Circulares */}
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[20px] font-black text-gray-900">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {data?.actividadesRecientes && data.actividadesRecientes.length > 0 ? (
              data.actividadesRecientes.map((act: any) => (
                <div key={act.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      "text-blue-500 bg-blue-50"
                    )}>
                      <Activity className="h-5 w-5" />
                    </div>
                    <p className="text-[15px] font-medium text-gray-700 group-hover:text-[#003366] transition-colors line-clamp-2">
                      {act.mensaje}
                    </p>
                  </div>
                  <span className="text-[13px] text-gray-400 whitespace-nowrap ml-4">{act.fecha}</span>
                </div>
              ))
            ) : (
              actividades.map((act) => (
                <div key={act.id} className="flex items-center justify-between group opacity-50">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", act.color)}>
                      <act.icono className="h-5 w-5" />
                    </div>
                    <p className="text-[15px] font-medium text-gray-700">{act.mensaje}</p>
                  </div>
                  <span className="text-[13px] text-gray-400 whitespace-nowrap ml-4">{act.fecha}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cuarta Fila: Donut Chart con Leyenda + Conflictos con Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución de Carga por Categoría (Donut) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-[20px] font-black text-gray-900">Distribución de Carga por Categoría</CardTitle>
            <CardDescription className="text-[14px]">Horas asignadas por categoría docente</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-6">
            <div className="h-[240px] w-full md:w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.avanceCategoria?.map((item: any, i: number) => ({
                      name: item.name,
                      value: item.value,
                      color: COLORS[i % COLORS.length]
                    })) || []}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(data?.avanceCategoria || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[12px] font-bold text-gray-400 uppercase">Total</span>
                <span className="text-[28px] font-black text-gray-900">
                  {data?.avanceCategoria?.reduce((acc: number, item: any) => acc + item.value, 0) || 0}
                </span>
                <span className="text-[12px] font-bold text-gray-400">horas</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-3">
              {(data?.avanceCategoria || []).map((item: any, i: number) => {
                const totalCarga = data?.avanceCategoria?.reduce((acc: number, it: any) => acc + it.value, 0) || 1;
                const cargaActual = item.value;
                const percent = Math.round((cargaActual / totalCarga) * 100);
                
                return (
                  <div key={i} className="flex items-center justify-between text-[14px]">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full")} style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium text-gray-600">{item.name}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-bold text-gray-900 w-10 text-right">{cargaActual}</span>
                      <span className="font-bold text-gray-400 w-10 text-right">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Conflictos Pendientes con Badges */}
        <Card className="border-none shadow-sm relative">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-[20px] font-black text-gray-900">Conflictos Pendientes</CardTitle>
              <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center">
                <span className="text-[12px] font-black text-red-600">{data?.kpis.conflictosPendientes || 0}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            {data?.listaConflictos && data.listaConflictos.length > 0 ? (
              data.listaConflictos.map((conf: any) => (
                <div key={conf.id_conflicto} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div>
                      <p className="text-[15px] font-bold text-gray-800 leading-none">{conf.tipo_conflicto}</p>
                      <p className="text-[13px] text-gray-400 mt-1 line-clamp-1">{conf.descripcion}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-md text-[11px] font-black tracking-widest",
                    conf.nivel_severidad === 'ALTO' ? "text-red-600 bg-red-50" : 
                    conf.nivel_severidad === 'MEDIO' ? "text-amber-600 bg-amber-50" : 
                    "text-blue-600 bg-blue-50"
                  )}>
                    {conf.nivel_severidad}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-[15px] font-bold text-gray-800">Sin conflictos</p>
                <p className="text-[13px] text-gray-400 mt-1">Todo el horario está en orden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
