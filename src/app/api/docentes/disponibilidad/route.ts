import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_docente, id_periodo, disponibilidad } = body;

    if (!id_docente || !id_periodo || !Array.isArray(disponibilidad)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Usar una transacción para asegurar atomicidad
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar disponibilidad anterior para este docente y periodo
      await tx.disponibilidadDocente.deleteMany({
        where: {
          id_docente: parseInt(id_docente),
          id_periodo: parseInt(id_periodo)
        }
      });

      // 2. Crear nuevos registros (solo los que no son disponibles, o todos si se prefiere)
      // Por simplicidad y consistencia con el flujo, guardamos todos los estados marcados/desmarcados
      if (disponibilidad.length > 0) {
        await tx.disponibilidadDocente.createMany({
          data: disponibilidad.map((d: any) => ({
            id_docente: parseInt(id_docente),
            id_periodo: parseInt(id_periodo),
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
    return NextResponse.json({ error: "Error al guardar disponibilidad" }, { status: 500 });
  }
}
