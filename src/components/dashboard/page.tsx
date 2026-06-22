import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardPrincipal from "@/components/dashboard/DashboardPrincipal";
import { ProteccionVentana } from "@/components/auth/ProteccionVentana";
import { 
  Calendar, 
  Clock,
  Grid3X3,
  FileText
} from "lucide-react";

import { CountdownTimer } from "@/components/dashboard/CountdownTimer";

import DashboardOperador from "@/components/dashboard/DashboardOperador";
import DashboardDocente from "@/components/dashboard/DashboardDocente";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }

  // Admin ve el Dashboard Principal (con mapas de calor, reportes agregados, etc)
  if (session.user.rol === 'administrador_sistema') {
    return <DashboardPrincipal />;
  }

  // Operador de horarios ve su dashboard operativo y directo al grano
  if (session.user.rol === "operador_horarios") {
    return <DashboardOperador />;
  }

  // El docente ve su propio dashboard con sus métricas
  return (
    <ProteccionVentana>
      <DashboardDocente />
    </ProteccionVentana>
  );
}
