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
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Encabezado */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Preferencias de Notificación</h2>
        <p className="text-slate-500 text-sm">
          Configure cómo desea recibir los recordatorios de selección de horarios. Recibirá notificaciones 24 horas antes y 15 minutos antes de su turno de atención.
        </p>
      </div>

      {/* Tarjetas de canales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Correo Electrónico */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-indigo-100 transition-all">
          <CardHeader className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Correo Electrónico</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Verificado y Principal</p>
                </div>
              </div>
              <Switch 
                className="data-[state=checked]:bg-[#1a237e]"
                checked={prefCorreo?.activo || false} 
                onCheckedChange={(val) => toggleCanal('correo', val)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <Input 
              value="juan.perez@unitru.edu.pe" 
              disabled 
              className="h-10 rounded-lg border-slate-200 bg-slate-50" 
            />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Verificado
              </span>
              <Button className="h-9 bg-[#1a237e] hover:bg-[#0d145a] text-white rounded-xl px-4 font-bold text-sm">
                Verificar Canal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Bot */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-sky-100 transition-all">
          <CardHeader className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plane className="h-5 w-5 text-sky-600" />
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Telegram Bot</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Automatizaciones instantáneas</p>
                </div>
              </div>
              <Switch 
                className="data-[state=checked]:bg-sky-500"
                checked={prefTelegram?.activo || false} 
                onCheckedChange={(val) => toggleCanal('telegram', val)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs text-slate-600">
                1. Abra Telegram y busque: <span className="font-bold text-[#1a237e]">@UNT_Horarios_Bot</span>
              </p>
              <p className="text-xs text-slate-600">
                2. Envíe el comando: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#1a237e] font-bold">/registrar DOC001</code>
              </p>
            </div>
            <div className="flex items-center justify-between">
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
              <Button className="h-9 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl px-4 font-bold text-sm">
                Mostrar QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Línea de tiempo */}
      <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-widest">
            Línea de tiempo de notificaciones del turno
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Turno - 24 horas antes</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Se enviará un resumen de su carga y fecha/hora programada a todos los canales activos habilitados.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0">
              <MessageSquare className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Turno - 15 minutos antes</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Se enviará un recordatorio urgente con el enlace de conexión y acceso directo solo por WhatsApp y Telegram.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
        <Button className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-6 font-bold text-sm">
          Probar Notificación
        </Button>
        <Button className="h-10 bg-[#1a237e] hover:bg-[#0d145a] text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-indigo-900/10">
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}
