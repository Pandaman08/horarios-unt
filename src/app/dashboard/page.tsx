import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardDocente from "@/components/dashboard/DashboardDocente";
import DashboardPrincipal from "@/components/dashboard/DashboardPrincipal";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  // Si el usuario es docente, mostrar su dashboard específico
  if (session.user.rol === 'docente') {
    return <DashboardDocente />;
  }

  // Para otros roles (Admin, Operador), mostrar el dashboard administrativo principal
  return <DashboardPrincipal />;
}
