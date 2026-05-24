import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardPrincipal from "@/components/dashboard/DashboardPrincipal";
import { ProteccionVentana } from "@/components/auth/ProteccionVentana";
import { PreferenciasNotificacion } from "@/components/notificaciones/PreferenciasNotificacion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen 
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

  // El docente ve su saludo y pestañas para selección y perfil
  return (
    <ProteccionVentana>
      <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
              <div className="h-7 w-7 rounded-full bg-[#1a237e] text-white flex items-center justify-center font-bold text-xs shadow-md">
                {session.user.name?.substring(0, 1)}
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">¡Hola, {session.user.name}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Portal Docente UNT</p>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <CountdownTimer variant="card" />
          </div>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsList className="bg-slate-50/50 p-1 rounded-lg border border-slate-100 mb-3 w-full sm:w-auto flex h-auto gap-1">
            <TabsTrigger value="home" className="flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold data-[state=active]:bg-[#1a237e] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <LayoutDashboard className="h-3 w-3" /> Inicio
            </TabsTrigger>
            <TabsTrigger value="perfil" className="flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold data-[state=active]:bg-[#1a237e] data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <Users className="h-3 w-3" /> Perfil y Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-3 outline-none focus:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 text-[#1a237e]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[7px] font-black bg-indigo-50 text-[#1a237e] px-1.5 py-0.5 rounded uppercase tracking-widest">Disponible</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">Selección de Horarios</h3>
                  <p className="text-[10px] text-slate-500 mt-1 mb-3 leading-tight line-clamp-2">
                    Acceda a la matriz de elección para programar sus sesiones académicas.
                  </p>
                  <a 
                    href="/dashboard/horarios/seleccion" 
                    className="inline-flex items-center justify-center bg-[#1a237e] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#0d145a] transition-all shadow-md shadow-indigo-100 w-full active:scale-95"
                  >
                    ACCEDER A LA MATRIZ
                  </a>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-slate-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-[7px] font-black bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Soporte</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">Guía de Usuario</h3>
                  <p className="text-[10px] text-slate-500 mt-1 mb-3 leading-tight line-clamp-2">
                    ¿Tiene dudas? Consulte nuestro manual interactivo para personal académico.
                  </p>
                  <button className="inline-flex items-center justify-center border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-50 transition-all w-full active:scale-95">
                    VER TUTORIAL
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="perfil" className="outline-none focus:outline-none">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <PreferenciasNotificacion />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProteccionVentana>
  );
}
