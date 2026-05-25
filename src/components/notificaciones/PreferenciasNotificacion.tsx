"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, XCircle, MessageSquare, Plane, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PreferenciasNotificacion() {
  const { data: session } = useSession();
  const [preferencias, setPreferencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferencias();
  }, []);

  const fetchPreferencias = async () => {
    try {
      const res = await fetch("/api/notificaciones/preferencias");
      const data = await res.json();
      setPreferencias(data);
    } catch (error) {
      toast.error("Error al cargar preferencias");
    } finally {
      setLoading(false);
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
        toast.success(`Notificaciones por ${canal} ${activo ? 'activadas' : 'desactivadas'}`);
        fetchPreferencias();
      }
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const getCanal = (nombre: string) => preferencias.find(p => p.canal === nombre);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <div className="h-8 w-8 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cargando Preferencias...</p>
    </div>
  );

  const prefTelegram = getCanal('telegram');
  const prefCorreo = getCanal('correo');

  return (
    <div className="space-y-6 w-full overflow-x-hidden animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="bg-card p-5 md:p-6 rounded-2xl border border-border shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Preferencias de Notificación</h2>
        <p className="text-muted-foreground text-sm">
          Configure cómo desea recibir los recordatorios de selección de horarios. Recibirá notificaciones 24 horas antes y 15 minutos antes de su turno de atención.
        </p>
      </div>

      {/* Tarjetas de canales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Correo Electrónico */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:border-primary/30 transition-all">
          <CardHeader className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Correo Electrónico</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Verificado y Principal</p>
                </div>
              </div>
              <Switch 
                className="data-[state=checked]:bg-primary"
                checked={prefCorreo?.activo || false} 
                onCheckedChange={(val) => toggleCanal('correo', val)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <Input 
              value="juan.perez@unitru.edu.pe" 
              disabled 
              className="h-10 rounded-xl border-border bg-muted/50 font-bold text-foreground opacity-70" 
            />
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Verificado
              </span>
              <Button className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 font-bold text-xs shadow-lg shadow-primary/10 transition-all active:scale-95">
                Verificar Canal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Bot */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:border-sky-500/30 transition-all">
          <CardHeader className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-sm shrink-0">
                  <Plane className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Telegram Bot</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatizaciones instantáneas</p>
                </div>
              </div>
              <Switch 
                className="data-[state=checked]:bg-sky-500"
                checked={prefTelegram?.activo || false} 
                onCheckedChange={(val) => toggleCanal('telegram', val)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="space-y-2 bg-muted/30 p-4 rounded-xl border border-border/50">
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black">1</span>
                Abra Telegram y busque: <span className="font-bold text-primary">@UNT_Horarios_Bot</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black">2</span>
                Envíe el comando: <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-bold">/registrar DOC001</code>
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={cn(
                "flex items-center gap-1.5 text-xs font-bold",
                prefTelegram?.verificado ? "text-emerald-600" : "text-amber-600"
              )}>
                {prefTelegram?.verificado ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {prefTelegram?.verificado ? "Verificado" : "Desconectado"}
              </span>
              <Button className="h-9 bg-muted hover:bg-muted/80 text-foreground rounded-xl px-5 font-bold text-xs border border-border transition-all active:scale-95">
                Mostrar QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Línea de tiempo */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="p-5 md:p-6 pb-4 border-b border-border/50">
          <CardTitle className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Línea de tiempo de notificaciones del turno
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-4 relative">
            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border/50" />
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-sm z-10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="pt-1">
              <p className="font-bold text-foreground text-sm uppercase tracking-tight">Turno - 24 horas antes</p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Se enviará un resumen de su carga y fecha/hora programada a todos los canales activos habilitados.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20 shrink-0 shadow-sm z-10">
              <MessageSquare className="h-5 w-5 text-destructive" />
            </div>
            <div className="pt-1">
              <p className="font-bold text-foreground text-sm uppercase tracking-tight">Turno - 15 minutos antes</p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Se enviará un recordatorio urgente con el enlace de conexión y acceso directo solo por WhatsApp y Telegram.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4">
        <Button className="h-11 bg-muted hover:bg-muted/80 text-foreground rounded-xl px-8 font-bold text-sm border border-border transition-all active:scale-95">
          Probar Notificación
        </Button>
        <Button className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-10 font-black text-sm shadow-lg shadow-primary/10 transition-all active:scale-95">
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}
