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
      <RefreshCw className="h-10 w-10 text-[#1a237e] animate-spin opacity-20" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando gestor...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Bell className="h-6 w-6 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Sistema de Notificaciones</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Monitoreo y Gestión de Alertas Multicanal</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 font-bold text-[13px] hover:bg-slate-50 transition-all px-6 text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Button 
            onClick={procesarColaManual} 
            disabled={processing}
            className="h-11 rounded-xl bg-[#1a237e] hover:bg-[#0d145a] text-white font-black text-[13px] shadow-lg shadow-indigo-100 transition-all active:scale-95 px-6"
          >
            <Send className="h-4 w-4 mr-2" /> Procesar Cola
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Pendientes</CardTitle>
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black text-slate-800 mb-1">{data?.stats?.colaPendiente || 0}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En espera de envío</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Incidencias</CardTitle>
            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black text-slate-800 mb-1">{data?.stats?.colaFallida || 0}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requieren reintento</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Entregados</CardTitle>
            <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-3xl font-black text-slate-800 mb-1">{data?.stats?.historialExito || 0}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmación total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
              <RefreshCw className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-[15px] font-black text-slate-800 tracking-tight">Historial Reciente de Envíos</CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registro de transacciones del notificador</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente / Receptor</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Canal</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo de Alerta</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha y Hora</TableHead>
                  <TableHead className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Previa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recientes?.map((notif: any) => (
                  <TableRow key={notif.id_notificacion} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                    <TableCell className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-[13px]">
                        {notif.docente ? `${notif.docente.apellidos}, ${notif.docente.nombres}` : 'Identificador Desconocido'}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm border",
                        notif.canal === 'telegram' ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      )}>
                        {notif.canal}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {notif.tipo_notificacion}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-[11px] font-bold text-slate-400 font-mono uppercase">
                      {notif.fecha_envio ? new Date(notif.fecha_envio).toLocaleString() : 'PENDIENTE'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-sm",
                        notif.estado_envio === 'enviado' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        {notif.estado_envio === 'enviado' ? 'Entregado' : 'Fallo Crítico'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-medium text-slate-400 max-w-[200px] truncate italic" title={notif.mensaje}>
                      {notif.mensaje}
                    </TableCell>
                  </TableRow>
                ))}
                {(!data?.recientes || data.recientes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Bell className="h-12 w-12 text-slate-400" />
                        <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">Sin actividad registrada en el periodo</p>
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
