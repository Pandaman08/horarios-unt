"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Mail,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Plane,
  Clock,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PreferenciasNotificacion() {
  const { data: session } = useSession();
  const [preferencias, setPreferencias] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(false);

  useEffect(() => {
    fetchPreferencias();
    fetchNotificaciones();
  }, []);

  const fetchPreferencias = async () => {
    try {
      const res = await fetch("/api/notificaciones/preferencias");
      const data = await res.json();
      setPreferencias(data);
    } catch {
      toast.error("Error al cargar preferencias");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificaciones = async () => {
    try {
      setLoadingNotificaciones(true);
      const res = await fetch("/api/notificaciones/docente");
      const data = await res.json();
      const todas = [
        ...(data.cola || []).map((n: any) => ({
          ...n,
          tipo: "cola",
          estado: "Pendiente",
        })),
        ...(data.historial || []).map((n: any) => ({
          ...n,
          tipo: "historial",
          estado: n.estado_envio === "enviado" ? "Enviado" : "Fallido",
        })),
      ]
        .sort((a: any, b: any) => {
          const fechaA = a.fecha_programada || a.fecha_envio;
          const fechaB = b.fecha_programada || b.fecha_envio;
          return new Date(fechaB).getTime() - new Date(fechaA).getTime();
        })
        .slice(0, 20);
      setNotificaciones(todas);
    } catch {
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoadingNotificaciones(false);
    }
  };

  const toggleCanal = async (canal: string, activo: boolean) => {
    try {
      const res = await fetch("/api/notificaciones/preferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal, activo }),
      });
      if (res.ok) {
        toast.success(
          `Notificaciones por ${canal} ${activo ? "activadas" : "desactivadas"}`
        );
        fetchPreferencias();
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const getCanal = (nombre: string) =>
    preferencias.find((p) => p.canal === nombre);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">
          Cargando Preferencias...
        </p>
      </div>
    );

  const prefTelegram = getCanal("telegram");
  const prefCorreo = getCanal("correo");

  return (
    <div className="space-y-6 w-full overflow-x-hidden animate-in fade-in duration-500">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      {/* bg-card usa --card que en dark = oklch(0.19 0.02 260) */}
      <div className="bg-card text-card-foreground border border-border p-5 md:p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold mb-2">
          Preferencias de Notificación
        </h2>
        <p className="text-muted-foreground text-sm">
          Configure cómo desea recibir los recordatorios de selección de
          horarios. Recibirá notificaciones 24 horas antes y 15 minutos antes de
          su turno de atención.
        </p>
      </div>

      {/* ── Tarjetas de canales ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* ── Correo Electrónico ── */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden hover:border-primary/50 transition-all duration-300">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">
                    Correo Electrónico
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verificado y Principal
                  </p>
                </div>
              </div>
              <Switch
                className="data-[state=checked]:bg-primary"
                checked={prefCorreo?.activo || false}
                onCheckedChange={(val) => toggleCanal("correo", val)}
              />
            </div>
          </div>
          <div className="p-5 pt-0 space-y-4">
            {/* Input nativo — evita que shadcn <Input> inyecte bg-background */}
            <input
              value="juan.perez@unitru.edu.pe"
              disabled
              className="w-full h-10 rounded-xl px-3 text-sm font-bold bg-muted text-muted-foreground border border-border disabled:cursor-not-allowed outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                Verificado
              </span>
              <Button className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-95">
                Verificar Canal
              </Button>
            </div>
          </div>
        </div>

        {/* ── Telegram Bot ── */}
        <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden hover:border-sky-500/50 transition-all duration-300">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-sm shrink-0">
                  <Plane className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">
                    Telegram Bot
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatizaciones instantáneas
                  </p>
                </div>
              </div>
              <Switch
                className="data-[state=checked]:bg-sky-500"
                checked={prefTelegram?.activo || false}
                onCheckedChange={(val) => toggleCanal("telegram", val)}
              />
            </div>
          </div>
          <div className="p-5 pt-0 space-y-4">
            {/* bg-muted = --muted que en dark es oklch(0.24 0.02 260) */}
            <div className="bg-muted border border-border space-y-2 p-4 rounded-xl">
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black shrink-0">
                  1
                </span>
                Abra Telegram y busque:{" "}
                <span className="font-bold text-primary">@UNT_Horarios_Bot</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black shrink-0">
                  2
                </span>
                Envíe el comando:{" "}
                <code className="bg-primary/15 px-1.5 py-0.5 rounded text-primary font-bold">
                  /registrar DOC001
                </code>
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs font-bold",
                  prefTelegram?.verificado
                    ? "text-emerald-500"
                    : "text-amber-500"
                )}
              >
                {prefTelegram?.verificado ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {prefTelegram?.verificado ? "Verificado" : "Desconectado"}
              </span>
              {/* Botón secundario con tokens semánticos */}
              <button className="h-9 bg-secondary hover:bg-accent text-secondary-foreground rounded-xl px-5 font-bold text-xs border border-border transition-all active:scale-95">
                Mostrar QR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Línea de tiempo ─────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 pb-4 border-b border-border">
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Línea de tiempo de notificaciones del turno
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4 relative">
            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-sm z-10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="pt-1">
              <p className="font-bold text-card-foreground text-sm uppercase tracking-tight">
                Turno - 24 horas antes
              </p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Se enviará un resumen de su carga y fecha/hora programada a
                todos los canales activos habilitados.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 shrink-0 shadow-sm z-10">
              <MessageSquare className="h-5 w-5 text-destructive" />
            </div>
            <div className="pt-1">
              <p className="font-bold text-card-foreground text-sm uppercase tracking-tight">
                Turno - 15 minutos antes
              </p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Se enviará un recordatorio urgente con el enlace de conexión y
                acceso directo solo por WhatsApp y Telegram.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Historial de Notificaciones ─────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 pb-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0 shadow-sm">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-card-foreground">
                Historial de Notificaciones
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Últimas 20 notificaciones recibidas
              </p>
            </div>
          </div>
          <button
            onClick={fetchNotificaciones}
            disabled={loadingNotificaciones}
            className="h-9 px-4 rounded-xl font-bold text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
          >
            {loadingNotificaciones ? (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              "Actualizar"
            )}
          </button>
        </div>

        <div className="p-5 md:p-6">
          {loadingNotificaciones ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Cargando notificaciones...
              </p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-2">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">
                No hay notificaciones todavía
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-[200px]">
                Las notificaciones aparecerán aquí una vez que sean programadas
                o enviadas.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr className="border-b border-border">
                    {["Tipo", "Canal", "Estado", "Fecha"].map((h) => (
                      <th
                        key={h}
                        className="text-[11px] font-black text-muted-foreground uppercase tracking-widest h-10 px-4 text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notificaciones.map((notif: any, idx: number) => (
                    <tr
                      key={notif.id_cola || notif.id_historial || idx}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-card-foreground">
                        {notif.tipo_notificacion}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            notif.canal === "telegram"
                              ? "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                              : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                          )}
                        >
                          {notif.canal === "telegram" ? (
                            <Plane className="h-3 w-3" />
                          ) : (
                            <Mail className="h-3 w-3" />
                          )}
                          {notif.canal}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            notif.estado === "Enviado"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : notif.estado === "Pendiente"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          )}
                        >
                          {notif.estado === "Enviado" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : notif.estado === "Pendiente" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {notif.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground font-medium">
                        {new Date(
                          notif.fecha_programada || notif.fecha_envio
                        ).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Botones de acción ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4">
        <button
          disabled
          className="h-11 bg-secondary text-secondary-foreground rounded-xl px-8 font-bold text-sm border border-border transition-all opacity-50 cursor-not-allowed w-full sm:w-auto"
        >
          Probar Notificación
        </button>
        <button
          disabled
          className="h-11 bg-primary text-primary-foreground rounded-xl px-10 font-black text-sm shadow-lg shadow-primary/10 opacity-50 cursor-not-allowed w-full sm:w-auto"
        >
          Guardar Preferencias
        </button>
      </div>
    </div>
  );
}