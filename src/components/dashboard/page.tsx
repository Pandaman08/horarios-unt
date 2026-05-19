import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardPrincipal from "@/components/dashboard/DashboardPrincipal";
import { ProteccionVentana } from "@/components/auth/ProteccionVentana";
import { PreferenciasNotificacion } from "@/components/notificaciones/PreferenciasNotificacion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <div className="p-2 max-w-4xl mx-auto space-y-2">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">¡Hola, {session.user.name}!</h1>
          <p className="text-[10px] font-bold text-gray-500 mt-0.5">Sistema de Gestión de Horarios - UNT</p>
        </div>

        <Tabs defaultValue="home" className="w-full">
          <TabsList className="bg-gray-50/50 p-1 rounded-md border border-gray-100 mb-2">
            <TabsTrigger value="home" className="px-3 py-1 rounded-md text-xs font-bold data-[state=active]:bg-[#003366] data-[state=active]:text-white">Inicio</TabsTrigger>
            <TabsTrigger value="perfil" className="px-3 py-1 rounded-md text-xs font-bold data-[state=active]:bg-[#003366] data-[state=active]:text-white">Perfil y Notificaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-indigo-900">Selección de Horarios</h3>
                  <p className="text-[10px] text-indigo-700">Accede a la matriz de elección.</p>
                </div>
                <a 
                  href="/dashboard/horarios/seleccion" 
                  className="bg-indigo-600 text-white px-3 py-1 rounded-md text-[10px] font-black hover:bg-indigo-700 transition-colors"
                >
                  IR
                </a>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-gray-900">Soporte</h3>
                  <p className="text-[10px] text-gray-700">¿Dudas? Contacta al coordinador.</p>
                </div>
                <button className="text-[#003366] text-[10px] font-black hover:underline">
                  GUÍA
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="perfil">
            <PreferenciasNotificacion />
          </TabsContent>
        </Tabs>
      </div>
    </ProteccionVentana>
  );
}
