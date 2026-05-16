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
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h1 className="text-3xl font-bold text-gray-800">¡Hola, {session.user.name}!</h1>
            <p className="text-gray-500 mt-2">Bienvenido al Sistema de Gestión de Horarios de Ingeniería de Sistemas.</p>
          </div>

          <Tabs defaultValue="home" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="home">Inicio</TabsTrigger>
              <TabsTrigger value="perfil">Mi Perfil y Notificaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="home">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h3 className="font-bold text-indigo-900">Selección de Horarios</h3>
                  <p className="text-sm text-indigo-700 mt-1">Accede a la matriz para elegir tus horarios de clase.</p>
                  <a 
                    href="/dashboard/horarios/seleccion" 
                    className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Ir a Selección
                  </a>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900">Ayuda y Soporte</h3>
                  <p className="text-sm text-gray-700 mt-1">¿Tienes dudas con el sistema? Contacta al coordinador.</p>
                  <button className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
                    Ver Guía de Usuario
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="perfil">
              <PreferenciasNotificacion />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProteccionVentana>
  );
}
