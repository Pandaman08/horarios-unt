"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Clock } from "lucide-react";

export function ProteccionVentana({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<{ tieneAcceso: boolean; soloLectura?: boolean; mensaje?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const res = await fetch("/api/auth/check-access");
      const data = await res.json();
      setAccess(data);
    } catch (error) {
      console.error("Error al verificar acceso", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Cargando...</div>;
  }

  // Permitir acceso si tiene acceso total O si es solo lectura
  if (access && !access.tieneAcceso && !access.soloLectura) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-700">
              Actualmente no se encuentra en su ventana de atención asignada.
            </p>
            <div className="bg-white p-4 rounded-md border border-red-100 flex items-start space-x-3 text-left">
              <Clock className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-gray-700">{access.mensaje}</p>
            </div>
            <p className="text-xs text-gray-500">
              El sistema se habilitará automáticamente cuando inicie su turno.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
