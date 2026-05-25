import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardPrincipal from "@/components/dashboard/DashboardPrincipal";
import { ProteccionVentana } from "@/components/auth/ProteccionVentana";
import { 
  Calendar, 
  Clock,
  Grid3X3
} from "lucide-react";

import { CountdownTimer } from "@/components/dashboard/CountdownTimer";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }

  // Roles administrativos ven el Dashboard Principal con estadísticas y catálogos
  if (['administrador_sistema', 'director_escuela', 'coordinador_academico'].includes(session.user.rol)) {
    return <DashboardPrincipal />;
  }

  // El operador tiene su propia vista de asignación, pero por defecto lo mandamos allá
  if (session.user.rol === 'operador_horarios') {
    redirect("/dashboard/horarios/asignacion");
  }

  // El docente ve su saludo y accesos directos
  return (
    <ProteccionVentana>
      <div className="max-w-6xl mx-auto space-y-3 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-card p-3 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
                {session.user.name?.substring(0, 1)}
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight leading-none">¡Hola, {session.user.name}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Portal Docente UNT</p>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <CountdownTimer variant="card" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Disponibilidad */}
            <div className="p-3 bg-card rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm flex flex-col justify-between group hover:border-blue-300 dark:hover:border-blue-800 transition-all bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-start justify-between mb-2">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <Grid3X3 className="h-4 w-4" />
                </div>
                <span className="text-[7px] font-black bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-widest">Activo</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground tracking-tight">Mi Disponibilidad</h3>
                <p className="text-[10px] text-muted-foreground mt-1 mb-3 leading-tight line-clamp-2">
                  Define los horarios donde puedes impartir tus clases.
                </p>
                <a 
                  href="/dashboard/disponibilidad" 
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-md w-full active:scale-95"
                >
                  EDITAR DISPONIBILIDAD
                </a>
              </div>
            </div>

            {/* Mi Horario */}
            <div className="p-3 bg-card rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-sm flex flex-col justify-between group hover:border-emerald-300 dark:hover:border-emerald-800 transition-all bg-emerald-50 dark:bg-emerald-950/30">
              <div className="flex items-start justify-between mb-2">
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-[7px] font-black bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded uppercase tracking-widest">Automático</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground tracking-tight">Mi Horario</h3>
                <p className="text-[10px] text-muted-foreground mt-1 mb-3 leading-tight line-clamp-2">
                  Visualiza los horarios asignados para cada periodo.
                </p>
                <a 
                  href="/dashboard/horarios/mi-horario" 
                  className="inline-flex items-center justify-center bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all shadow-md w-full active:scale-95"
                >
                  VER MI HORARIO
                </a>
              </div>
            </div>

            {/* Selección de Horarios */}
            <div className="p-3 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between group hover:border-border transition-all opacity-60">
              <div className="flex items-start justify-between mb-2">
                <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center border border-border text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-[7px] font-black bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-widest">Inactivo</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground tracking-tight">Selección de Cursos</h3>
                <p className="text-[10px] text-muted-foreground mt-1 mb-3 leading-tight line-clamp-2">
                  Disponible solo durante ventana de atención programada.
                </p>
                <a 
                  href="/dashboard/horarios/seleccion" 
                  className="inline-flex items-center justify-center bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-not-allowed w-full"
                >
                  NO DISPONIBLE AHORA
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProteccionVentana>
  );
}
