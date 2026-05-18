"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  if (loading) return <div>Cargando preferencias...</div>;

  const prefTelegram = getCanal('telegram');
  const prefCorreo = getCanal('correo');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Canales de Notificación</CardTitle>
          <CardDescription>Configura cómo deseas recibir los recordatorios de tus ventanas de atención.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Correo Electrónico */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Correo Electrónico</p>
                <p className="text-sm text-muted-foreground">Recibe alertas 24 horas antes.</p>
              </div>
            </div>
            <Switch 
              checked={prefCorreo?.activo || false} 
              onCheckedChange={(val) => toggleCanal('correo', val)}
            />
          </div>

          {/* Telegram */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="bg-sky-100 p-2 rounded-full">
                <Send className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">Telegram Bot</p>
                  {prefTelegram?.verificado ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-green-600 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-600 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded-full">
                      <XCircle className="h-3 w-3 mr-1" /> No vinculado
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Alertas urgentes 15 minutos antes.</p>
              </div>
            </div>
            <Switch 
              checked={prefTelegram?.activo || false} 
              onCheckedChange={(val) => toggleCanal('telegram', val)}
            />
          </div>

          {!prefTelegram?.verificado && (
            <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 space-y-3">
              <h4 className="text-sm font-bold text-sky-900">¿Cómo vincular Telegram?</h4>
              <ol className="text-xs text-sky-800 space-y-2 list-decimal list-inside">
                <li>Busca al bot <b>@HorariosUNT_Bot</b> en Telegram.</li>
                <li>Envía el comando: <code className="bg-white px-1 py-0.5 rounded border border-sky-200 font-bold">/start TU_CODIGO</code></li>
                <li>¡Listo! Tu cuenta quedará vinculada automáticamente.</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
