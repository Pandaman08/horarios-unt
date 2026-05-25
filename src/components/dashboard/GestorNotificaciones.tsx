"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GestorNotificaciones() {
  const [data, setData] = useState<any>(null);
  const [colaPendiente, setColaPendiente] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCola, setLoadingCola] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [prevStats, setPrevStats] = useState<{ pendientes?: number; fallidas?: number; exito?: number }>({});
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/notificaciones/admin?type=stats");
      const result = await res.json();
      
      if (data) {
        const oldPend = data.stats?.colaPendiente || 0;
        const newPend = result.stats?.colaPendiente || 0;
        const oldFall = data.stats?.colaFallida || 0;
        const newFall = result.stats?.colaFallida || 0;
        const oldExito = data.stats?.historialExito || 0;
        const newExito = result.stats?.historialExito || 0;
        
        if (newPend !== oldPend || newFall !== oldFall || newExito !== oldExito) {
          setHasNewActivity(true);
          if (showToast) {
            toast.success("Datos actualizados");
          }
          setTimeout(() => setHasNewActivity(false), 3000);
        }
      }
      
      setPrevStats({
        pendientes: result.stats?.colaPendiente,
        fallidas: result.stats?.colaFallida,
        exito: result.stats?.historialExito
      });
      
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchColaPendiente = async () => {
    try {
      setLoadingCola(true);
      const res = await fetch("/api/notificaciones/admin?type=cola");
      if (!res.ok) throw new Error("Error en la API");
      const result = await res.json();
      setColaPendiente(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error al cargar cola pendiente:", error);
      setColaPendiente([]);
    } finally {
      setLoadingCola(false);
    }
  };

  const procesarColaManual = async () => {
    try {
      setProcessing(true);
      const res = await fetch("/api/notificaciones/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "procesar_cola" }),
      });

      if (res.ok) {
        toast.success("Procesamiento de cola iniciado");
        fetchData(true);
        fetchColaPendiente();
      }
    } catch (error) {
      toast.error("Error al procesar cola");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchColaPendiente();
    
    pollingRef.current = setInterval(() => {
      fetchData();
      fetchColaPendiente();
    }, 30000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  if (loading && !data) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <RefreshCw className="h-10 w-10 text-[#1a237e] animate-spin opacity-20" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando gestor...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full overflow-x-hidden">
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Gestor de Notificaciones</h2>
              {hasNewActivity && (
                <Badge className="animate-pulse bg-amber-100 text-amber-700 border-amber-200 font-bold">
                  <Activity className="h-3 w-3 mr-1" />
                  Nuevos cambios
                </Badge>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Monitorea y gestiona las notificaciones del sistema. Se actualiza automáticamente cada 30 segundos.
            </p>
            {lastUpdate && (
              <p className="text-[10px] font-medium text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Estadísticas del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg relative">
            {prevStats.pendientes !== undefined && data?.stats?.colaPendiente > prevStats.pendientes && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-amber-500 text-white animate-bounce font-bold">
                  +{data.stats.colaPendiente - prevStats.pendientes}
                </Badge>
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Pendientes</CardTitle>
              <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-black text-slate-800 mb-1 transition-all duration-300">
                {data?.stats?.colaPendiente || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En espera de envío</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg relative">
            {prevStats.fallidas !== undefined && data?.stats?.colaFallida > prevStats.fallidas && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-rose-500 text-white animate-bounce font-bold">
                  +{data.stats.colaFallida - prevStats.fallidas}
                </Badge>
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Incidencias</CardTitle>
              <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-black text-slate-800 mb-1 transition-all duration-300">
                {data?.stats?.colaFallida || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requieren reintento</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg relative">
            {prevStats.exito !== undefined && data?.stats?.historialExito > prevStats.exito && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-emerald-500 text-white animate-bounce font-bold">
                  +{data.stats.historialExito - prevStats.exito}
                </Badge>
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Entregados</CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-3xl font-black text-slate-800 mb-1 transition-all duration-300">
                {data?.stats?.historialExito || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmación total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)} 
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 font-bold text-[13px] hover:bg-slate-50 transition-all px-6 text-slate-600 flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? 'Actualizando...' : 'Sincronizar'}
          </Button>
          <Button 
            onClick={procesarColaManual} 
            disabled={processing}
            className="h-11 rounded-xl bg-[#1a237e] hover:bg-[#0d145a] text-white font-black text-[13px] shadow-lg shadow-indigo-100 transition-all active:scale-95 px-6 flex-1 sm:flex-none"
          >
            <Send className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} /> 
            {processing ? 'Procesando...' : 'Procesar Cola'}
          </Button>
        </div>
      </div>

      {/* Cola Pendiente */}
      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-[15px] font-black text-slate-800 tracking-tight">Cola de Notificaciones Pendientes</CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Notificaciones esperando ser enviadas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingCola ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando cola...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente / Receptor</TableHead>
                    <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Canal</TableHead>
                    <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</TableHead>
                    <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha Programada</TableHead>
                    <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</TableHead>
                    <TableHead className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Previa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colaPendiente?.map((notif: any, idx: number) => (
                    <TableRow 
                      key={notif.id_notificacion} 
                      className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-300 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <TableCell className="px-4 md:px-6 py-4">
                        <p className="font-bold text-slate-800 text-[13px]">
                          {notif.docente ? `${notif.docente.apellidos}, ${notif.docente.nombres}` : 'Identificador Desconocido'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm border",
                          notif.canal === 'telegram' 
                            ? "bg-sky-50 text-sky-700 border-sky-100" 
                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                        )}>
                          {notif.canal}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border",
                          notif.tipo_notificacion?.includes('horario') 
                            ? "bg-purple-50 text-purple-700 border-purple-100" 
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          {notif.tipo_notificacion}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-[11px] font-bold text-slate-500 font-mono">
                          {notif.fecha_programada ? new Date(notif.fecha_programada).toLocaleString() : (
                            <span className="text-amber-600 flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pendiente
                            </span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1 mx-auto w-fit",
                          notif.estado === 'pendiente' 
                            ? "bg-amber-50 text-amber-700 border-amber-100" 
                            : notif.estado === 'fallido'
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {notif.estado === 'pendiente' ? (
                            <>
                              <Clock className="h-3 w-3" />
                              Pendiente
                            </>
                          ) : notif.estado === 'fallido' ? (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              Fallido
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Listo
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 md:px-6 py-4">
                        <p className="text-[11px] font-medium text-slate-400 max-w-[200px] truncate italic" title={notif.datos_mensaje?.asunto || notif.datos_mensaje?.texto}>
                          {notif.datos_mensaje?.asunto || notif.datos_mensaje?.texto}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!colaPendiente || colaPendiente.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-24">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <Clock className="h-12 w-12 text-slate-400" />
                          <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">Cola vacía</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial Reciente */}
      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
              <Bell className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-[15px] font-black text-slate-800 tracking-tight">Historial Reciente de Envíos</CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Últimas 10 notificaciones
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente / Receptor</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Canal</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha y Hora</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</TableHead>
                  <TableHead className="px-4 md:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Previa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recientes?.map((notif: any, idx: number) => (
                  <TableRow 
                    key={notif.id_notificacion} 
                    className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-300 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <TableCell className="px-4 md:px-6 py-4">
                      <p className="font-bold text-slate-800 text-[13px]">
                        {notif.docente ? `${notif.docente.apellidos}, ${notif.docente.nombres}` : 'Identificador Desconocido'}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm border",
                        notif.canal === 'telegram' 
                          ? "bg-sky-50 text-sky-700 border-sky-100" 
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      )}>
                        {notif.canal}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border",
                        notif.tipo_notificacion?.includes('horario') 
                          ? "bg-purple-50 text-purple-700 border-purple-100" 
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        {notif.tipo_notificacion}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <p className="text-[11px] font-bold text-slate-500 font-mono">
                        {notif.fecha_envio ? new Date(notif.fecha_envio).toLocaleString() : (
                          <span className="text-amber-600 flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm flex items-center justify-center gap-1 mx-auto w-fit",
                        notif.estado_envio === 'enviado' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        {notif.estado_envio === 'enviado' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Entregado
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Fallo Crítico
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 md:px-6 py-4">
                      <p className="text-[11px] font-medium text-slate-400 max-w-[200px] truncate italic" title={notif.mensaje}>
                        {notif.mensaje}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.recientes || data.recientes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Bell className="h-12 w-12 text-slate-400" />
                        <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">Sin actividad registrada</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
