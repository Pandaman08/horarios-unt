import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ValidacionDepartamentoClient from "./ValidacionDepartamentoClient";

export default async function ValidacionDepartamentoPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <div className="p-8">No autorizado</div>;
  }

  const periodos = await prisma.periodoAcademico.findMany({
    where: { activo: true },
    orderBy: { fecha_inicio: 'desc' }
  });

  return <ValidacionDepartamentoClient periodos={periodos} />;
}
