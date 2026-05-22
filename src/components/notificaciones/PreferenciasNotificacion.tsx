"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, XCircle } from "lucide-react";
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
    <div className="space-y-0">
      <Card className="rounded-none border-none shadow-none bg-white">
        <CardHeader className="p-8 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <Send className="h-5 w-5 text-[#1a237e]" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Canales de Notificación</CardTitle>
              <CardDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configura tus alertas y recordatorios</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {/* Correo Electrónico */}
          <div className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50/30 group hover:bg-white hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-[#1a237e] group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-black text-slate-800">Correo Electrónico Institucional</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">Alertas de cambios en la matriz y recordatorios 24 horas antes.</p>
              </div>
            </div>
            <Switch 
              className="data-[state=checked]:bg-[#1a237e]"
              checked={prefCorreo?.activo || false} 
              onCheckedChange={(val) => toggleCanal('correo', val)}
            />
          </div>

          {/* Telegram */}
          <div className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50/30 group hover:bg-white hover:border-sky-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-sky-600 group-hover:scale-110 transition-transform">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-[14px] font-black text-slate-800">Telegram Bot (Alertas Instantáneas)</p>
                  {prefTelegram?.verificado ? (
                    <span className="inline-flex items-center text-[9px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-lg tracking-wider">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> VINCULADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-black text-amber-600 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-lg tracking-wider">
                      <XCircle className="h-3 w-3 mr-1" /> NO VINCULADO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">Notificaciones críticas y alertas 15 minutos antes de la sesión.</p>
              </div>
            </div>
            <Switch 
              className="data-[state=checked]:bg-sky-500"
              checked={prefTelegram?.activo || false} 
              onCheckedChange={(val) => toggleCanal('telegram', val)}
            />
          </div>

          {!prefTelegram?.verificado && (
            <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100 mt-4 flex items-start gap-4">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-sky-100 text-sky-600 shadow-sm shrink-0">
                <span className="text-lg font-black">?</span>
              </div>
              <div>
                <h4 className="text-[12px] font-black text-sky-900 uppercase tracking-widest mb-1.5">¿Cómo vincular mi cuenta?</h4>
                <p className="text-[12px] text-sky-800 font-medium leading-relaxed">
                  Busque el bot <b className="font-black">@HorariosUNT_Bot</b> en Telegram y envíe el siguiente comando:
                </p>
                <div className="mt-3 inline-block">
                  <code className="bg-white px-4 py-2 rounded-xl border border-sky-200 font-mono font-bold text-sky-700 shadow-sm">
                    /start {session?.user?.codigo || "TU_CODIGO"}
                  </code>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
