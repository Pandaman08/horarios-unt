import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CargaHorariaClient from "./CargaHorariaClient";

export default async function CargaHorariaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id_docente) {
    return <div className="p-8">No autorizado</div>;
  }

  const docente = await prisma.docente.findUnique({
    where: { id_docente: session.user.id_docente }
  });

  if (!docente) {
    return <div className="p-8">Docente no encontrado</div>;
  }

  return <CargaHorariaClient initialDocente={docente} />;
}

