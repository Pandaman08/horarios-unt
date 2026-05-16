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
  Activity
} from "lucide-react";
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
}

const COLORS = ["#4f46e5", "#818cf8", "#c7d2fe", "#e0e7ff"];

export function DashboardStats({ id_periodo }: { id_periodo: number }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actividades, setActividades] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    setupSocket();
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
          { id: Date.now(), mensaje: payload.mensaje, fecha: new Date() },
          ...prev.slice(0, 9)
        ]);
      }
    });
    return () => socket.off("horario-actualizado");
  };

  if (loading || !data) return <div className="p-8 text-center">Cargando estadísticas...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Docentes" 
          value={data.kpis.totalDocentes} 
          icon={Users} 
          color="text-blue-600" 
          bgColor="bg-blue-100" 
        />
        <KPICard 
          title="Asignaciones" 
          value={data.kpis.asignacionesRealizadas} 
          icon={CalendarCheck} 
          color="text-green-600" 
          bgColor="bg-green-100" 
        />
        <KPICard 
          title="Conflictos" 
          value={data.kpis.conflictosPendientes} 
          icon={AlertTriangle} 
          color="text-red-600" 
          bgColor="bg-red-100" 
        />
        <KPICard 
          title="Avance Total" 
          value={`${data.kpis.porcentajeAvance}%`} 
          icon={TrendingUp} 
          color="text-indigo-600" 
          bgColor="bg-indigo-100" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupación de Ambientes */}
        <Card>
          <CardHeader>
            <CardTitle>Ocupación de Aulas y Laboratorios</CardTitle>
            <CardDescription>Top 10 ambientes con más carga horaria</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ocupacionAmbientes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Carga Docente */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Carga Docente</CardTitle>
            <CardDescription>Docentes con más horas asignadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cargaDocente}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="asignaciones" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avance por Categoría */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Avance por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.avanceCategoria}
                  dataKey="_count.id_docente"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ categoria }) => categoria.replace("_", " ")}
                >
                  {data.avanceCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feed de Actividad */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-indigo-600" /> Feed de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actividades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Esperando actividad en tiempo real...</p>
              ) : (
                actividades.map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                    <div className="bg-indigo-50 p-2 rounded-full">
                      <CalendarCheck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{act.mensaje}</p>
                      <p className="text-xs text-muted-foreground">{new Date(act.fecha).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
