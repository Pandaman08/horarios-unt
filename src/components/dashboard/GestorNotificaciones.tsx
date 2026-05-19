"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, RefreshCw, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

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

  if (loading && !data) return <div className="p-8 text-center">Cargando gestor de notificaciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sistema de Notificaciones</h2>
          <p className="text-muted-foreground">Monitorea y gestiona el envío de alertas multicanal.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Button onClick={procesarColaManual} disabled={processing}>
            <Send className="h-4 w-4 mr-2" /> Procesar Cola Ahora
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes en Cola</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.colaPendiente || 0}</div>
            <p className="text-xs text-muted-foreground">Listas para ser enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fallidas (Reintentos)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.colaFallida || 0}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enviadas con Éxito</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.historialExito || 0}</div>
            <p className="text-xs text-muted-foreground">Historial acumulado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Envíos</CardTitle>
          <CardDescription>Registro reciente de actividad del notificador.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recientes?.map((notif: any) => (
                <TableRow key={notif.id_notificacion}>
                  <TableCell className="font-medium">
                    {notif.docente?.nombres} {notif.docente?.apellidos}
                  </TableCell>
                  <TableCell>
                    <Badge variant={notif.canal === 'telegram' ? 'default' : 'secondary'}>
                      {notif.canal}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{notif.tipo_notificacion}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(notif.fecha_envio).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={notif.estado_envio === 'enviado' ? 'default' : 'destructive'}>
                      {notif.estado_envio === 'enviado' ? 'Enviado' : 'Fallido'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground max-w-[150px] truncate" title={notif.mensaje}>
                    {notif.mensaje}
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.recientes || data.recientes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No hay actividad reciente.
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
