"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell, RefreshCw, Send, AlertTriangle, CheckCircle2,
  Clock, Mail, Plane, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GestorNotificaciones() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filtroVentana, setFiltroVentana] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = filtroVentana
        ? `/api/notificaciones/admin?type=stats&id_ventana=${filtroVentana}`
        : "/api/notificaciones/admin?type=stats";
      const res = await fetch(url);
      setData(await res.json());
    } catch {
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
      if (res.ok) { toast.success("Procesamiento de cola iniciado"); fetchData(); }
    } catch {
      toast.error("Error al procesar cola");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !data)
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin opacity-30" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Cargando gestor...
        </p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full overflow-x-hidden">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border p-5 md:p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          Preferencias de Notificación
        </h2>
        <p className="text-muted-foreground text-sm">
          Configure cómo desea recibir los recordatorios de selección de horarios.
          Recibirá notificaciones 24 horas antes y 15 minutos antes de su turno de atención.
        </p>
      </div>

      {/* ── Tarjetas de canales ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Correo */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden hover:border-primary/40 transition-all duration-300">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">Correo Electrónico</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verificado y Principal</p>
                </div>
              </div>
              <Switch className="data-[state=checked]:bg-primary" />
            </div>
          </div>
          <div className="p-5 pt-0 space-y-3">
            <input
              value="juan.perez@unitru.edu.pe"
              disabled
              className="w-full h-10 rounded-xl px-3 text-sm font-bold bg-muted text-muted-foreground border border-border disabled:cursor-not-allowed outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <CheckCircle2 className="h-4 w-4" /> Verificado
              </span>
              <Button className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 font-bold text-sm">
                Verificar Canal
              </Button>
            </div>
          </div>
        </div>

        {/* Telegram */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden hover:border-sky-500/40 transition-all duration-300">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 shrink-0">
                  <Plane className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">Telegram Bot</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatizaciones instantáneas</p>
                </div>
              </div>
              <Switch className="data-[state=checked]:bg-sky-500" />
            </div>
          </div>
          <div className="p-5 pt-0 space-y-3">
            <div className="bg-muted border border-border space-y-1.5 p-4 rounded-xl">
              <p className="text-xs text-muted-foreground">
                1. Abra Telegram y busque:{" "}
                <span className="font-bold text-primary">@UNT_Horarios_Bot</span>
              </p>
              <p className="text-xs text-muted-foreground">
                2. Envíe el comando:{" "}
                <code className="bg-primary/15 px-1.5 py-0.5 rounded text-primary font-bold">
                  /registrar DOC001
                </code>
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <Clock className="h-4 w-4" /> Desconectado
              </span>
              <button className="h-9 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl px-4 font-bold text-sm border border-border transition-all active:scale-95">
                Mostrar QR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Línea de tiempo ─────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 pb-4 border-b border-border">
          <p className="text-base font-bold text-card-foreground uppercase tracking-widest">
            Línea de tiempo de notificaciones del turno
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Turno - 24 horas antes</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Se enviará un resumen de su carga y fecha/hora programada a todos los canales activos habilitados.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 shrink-0">
              <MessageSquare className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Turno - 15 minutos antes</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Se enviará un recordatorio urgente con el enlace de conexión y acceso directo solo por WhatsApp y Telegram.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Botones de acción ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
        <button className="h-10 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl px-6 font-bold text-sm border border-border transition-all active:scale-95 w-full sm:w-auto">
          Probar Notificación
        </button>
        <button className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 w-full sm:w-auto">
          Guardar Preferencias
        </button>
      </div>

      {/* ── Gestión del Sistema ─────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border p-5 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-card-foreground mb-4">Gestión del Sistema</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          {/* Pendientes */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden group transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pendientes</p>
              <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="text-3xl font-black text-card-foreground mb-1">
                {data?.stats?.colaPendiente || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  En espera de envío
                </p>
              </div>
            </div>
          </div>

          {/* Incidencias */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden group transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Incidencias</p>
              <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="text-3xl font-black text-card-foreground mb-1">
                {data?.stats?.colaFallida || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Requieren reintento
                </p>
              </div>
            </div>
          </div>

          {/* Entregados */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden group transition-all hover:shadow-md">
            <div className="flex flex-row items-center justify-between p-6 pb-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Entregados</p>
              <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="text-3xl font-black text-card-foreground mb-1">
                {data?.stats?.historialExito || 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Confirmación total
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="h-11 rounded-xl bg-secondary hover:bg-accent text-secondary-foreground font-bold text-[13px] border border-border transition-all px-6 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Sincronizar
          </button>
          <button
            onClick={procesarColaManual}
            disabled={processing}
            className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[13px] shadow-lg shadow-primary/10 transition-all active:scale-95 px-6 flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Procesar Cola
          </button>
        </div>
      </div>

      {/* ── Historial Reciente de Envíos ────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center border border-border">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[15px] font-black text-card-foreground tracking-tight">
                  Historial Reciente de Envíos
                </p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  Registro de transacciones del notificador
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Filtrar por ID ventana..."
                value={filtroVentana}
                onChange={(e) => setFiltroVentana(e.target.value)}
                className="h-9 w-48 text-sm rounded-lg px-3 bg-muted text-foreground border border-border outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={fetchData}
                disabled={loading}
                className="h-9 px-4 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground font-bold text-xs border border-border transition-colors disabled:opacity-50"
              >
                Filtrar
              </button>
              {filtroVentana && (
                <button
                  onClick={() => { setFiltroVentana(""); fetchData(); }}
                  className="h-9 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b border-border">
                {["Docente / Receptor", "Canal", "Tipo de Alerta", "Fecha y Hora", "Estado", "Vista Previa"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.recientes?.map((notif: any) => (
                <tr
                  key={notif.id_notificacion}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-card-foreground text-[13px]">
                      {notif.docente
                        ? `${notif.docente.apellidos}, ${notif.docente.nombres}`
                        : "Identificador Desconocido"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                      notif.canal === "telegram"
                        ? "bg-sky-500/10 text-sky-500 border-sky-500/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {notif.canal}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border",
                      notif.tipo_notificacion === "horario_asignado_automatico"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {notif.tipo_notificacion}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-[11px] font-bold text-muted-foreground font-mono uppercase">
                    {notif.fecha_envio
                      ? new Date(notif.fecha_envio).toLocaleString()
                      : "PENDIENTE"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                      notif.estado_envio === "enviado"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {notif.estado_envio === "enviado" ? "Entregado" : "Fallo Crítico"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground max-w-[200px] truncate italic" title={notif.mensaje}>
                    {notif.mensaje}
                  </td>
                </tr>
              ))}

              {(!data?.recientes || data.recientes.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Bell className="h-12 w-12 text-muted-foreground" />
                      <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">
                        Sin actividad registrada en el periodo
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}