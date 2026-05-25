import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id_usuario) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id_docente, id_periodo, disponibilidad } = body;

    if (!id_docente || !id_periodo || !Array.isArray(disponibilidad)) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const idDocente = id_docente;

    // Usar una transacción para asegurar atomicidad
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar disponibilidad anterior para este docente y periodo
      await tx.disponibilidadDocente.deleteMany({
        where: {
          id_docente: idDocente,
          id_periodo: id_periodo
        }
      });

      // 2. Crear nuevos registros
      if (disponibilidad.length > 0) {
        await tx.disponibilidadDocente.createMany({
          data: disponibilidad.map((d: any) => ({
            id_docente: idDocente,
            id_periodo: id_periodo,
            dia_semana: d.dia_semana,
            hora_inicio: d.hora_inicio,
            hora_fin: d.hora_fin,
            disponible: d.disponible
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al guardar disponibilidad:", error);
    return NextResponse.json(
      { error: "Error al guardar disponibilidad" },
      { status: 500 }
    );
  }
}

