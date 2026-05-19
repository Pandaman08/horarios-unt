"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GestorNotificaciones() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notificaciones/admin?type=stats");
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
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
        fetchData();
      }
    } catch (error) {
      toast.error("Error al procesar cola");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !data) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <RefreshCw className="h-10 w-10 text-[#003366] animate-spin opacity-20" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando gestor...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-[#003366] rounded-[22px] flex items-center justify-center shadow-xl shadow-blue-900/20">
            <Bell className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">Sistema de Notificaciones</h2>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Monitoreo y gestión de alertas multicanal</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="flex-1 md:flex-none h-11 rounded-xl border-gray-200 font-bold text-xs hover:bg-gray-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Button 
            onClick={procesarColaManual} 
            disabled={processing}
            className="flex-1 md:flex-none h-11 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-black text-xs shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            <Send className="h-4 w-4 mr-2" /> Procesar Cola Ahora
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[32px] border-none shadow-xl shadow-blue-900/5 bg-white overflow-hidden group transition-all hover:shadow-2xl hover:shadow-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">Pendientes en Cola</CardTitle>
            <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900 mb-1">{data?.stats?.colaPendiente || 0}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Listas para ser enviadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-xl shadow-blue-900/5 bg-white overflow-hidden group transition-all hover:shadow-2xl hover:shadow-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">Fallidas (Reintentos)</CardTitle>
            <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900 mb-1">{data?.stats?.colaFallida || 0}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Requieren atención</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-xl shadow-blue-900/5 bg-white overflow-hidden group transition-all hover:shadow-2xl hover:shadow-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">Enviadas con Éxito</CardTitle>
            <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900 mb-1">{data?.stats?.historialExito || 0}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Historial acumulado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[40px] border-none shadow-xl shadow-blue-900/5 bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50 p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-900">Últimos Envíos</CardTitle>
              <CardDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Registro reciente de actividad del notificador</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Docente</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Canal</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Tipo</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Fecha</TableHead>
                <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Estado</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recientes?.map((notif: any) => (
                <TableRow key={notif.id_notificacion} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <TableCell className="px-8 py-4 font-black text-gray-900 text-xs">
                    {notif.docente?.nombres} {notif.docente?.apellidos}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      notif.canal === 'telegram' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {notif.canal}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                    {notif.tipo_notificacion}
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold text-gray-400">
                    {new Date(notif.fecha_envio).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      notif.estado_envio === 'enviado' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {notif.estado_envio === 'enviado' ? 'Enviado' : 'Fallido'}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-[10px] font-medium text-gray-400 max-w-[200px] truncate italic" title={notif.mensaje}>
                    {notif.mensaje}
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.recientes || data.recientes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Bell className="h-10 w-10 text-gray-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">No hay actividad reciente</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
