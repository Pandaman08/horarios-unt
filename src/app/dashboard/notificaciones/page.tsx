"use client";

import { useSession } from "next-auth/react";
import { PreferenciasNotificacion } from "@/components/notificaciones/PreferenciasNotificacion";
import { GestorNotificaciones } from "@/components/dashboard/GestorNotificaciones";
import { Loader2 } from "lucide-react";

export default function NotificacionesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-[#1a237e] animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</p>
      </div>
    );
  }

  const userRol = session?.user?.rol;
  const isAdminOrOperador = ['administrador_sistema', 'operador_horarios', 'director_escuela', 'coordinador_academico'].includes(userRol || '');

  return (
    <div className="p-4 max-w-[1800px] mx-auto space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isAdminOrOperador ? <GestorNotificaciones /> : <PreferenciasNotificacion />}
      </div>
    </div>
  );
}
