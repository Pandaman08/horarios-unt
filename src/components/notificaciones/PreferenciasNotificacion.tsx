"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function PreferenciasNotificacion() {
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

  if (loading) return <div className="text-[10px] font-bold text-gray-400">Cargando...</div>;

  const prefTelegram = getCanal('telegram');
  const prefCorreo = getCanal('correo');

  return (
    <div className="space-y-2">
      <Card className="rounded-md border-gray-100">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-[#003366]">Canales de Notificación</CardTitle>
          <CardDescription className="text-[10px] font-medium text-gray-500">Configura tus recordatorios.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {/* Correo Electrónico */}
          <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-1.5 rounded-md">
                <Mail className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-900">Correo Electrónico</p>
                <p className="text-[9px] text-gray-500">Alertas 24 horas antes.</p>
              </div>
            </div>
            <Switch 
              className="scale-75"
              checked={prefCorreo?.activo || false} 
              onCheckedChange={(val) => toggleCanal('correo', val)}
            />
          </div>

          {/* Telegram */}
          <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="bg-sky-50 p-1.5 rounded-md">
                <Send className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold text-gray-900">Telegram Bot</p>
                  {prefTelegram?.verificado ? (
                    <span className="inline-flex items-center text-[8px] font-black text-green-600 border border-green-200 bg-green-50 px-1 py-0 rounded-full">
                      <CheckCircle2 className="h-2 w-2 mr-0.5" /> VERIFICADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[8px] font-black text-amber-600 border border-amber-200 bg-amber-50 px-1 py-0 rounded-full">
                      <XCircle className="h-2 w-2 mr-0.5" /> NO VINCULADO
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-gray-500">Alertas 15 minutos antes.</p>
              </div>
            </div>
            <Switch 
              className="scale-75"
              checked={prefTelegram?.activo || false} 
              onCheckedChange={(val) => toggleCanal('telegram', val)}
            />
          </div>

          {!prefTelegram?.verificado && (
            <div className="bg-sky-50/50 p-2 rounded-md border border-sky-100">
              <h4 className="text-[10px] font-black text-sky-900 uppercase mb-1">¿Cómo vincular?</h4>
              <p className="text-[9px] text-sky-800 leading-tight">
                Busca <b>@HorariosUNT_Bot</b> y envía: <code className="bg-white px-1 rounded border border-sky-200 font-bold">/start TU_CODIGO</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
