import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { docenteId: string } }
) {
  try {
    const docenteId = parseInt(params.docenteId);
    const { searchParams } = new URL(req.url);
    const periodoId = searchParams.get("periodoId");

    if (!periodoId) {
      return NextResponse.json({ error: "periodoId es obligatorio" }, { status: 400 });
    }

    const disponibilidad = await prisma.disponibilidadDocente.findMany({
      where: {
        id_docente: docenteId,
        id_periodo: parseInt(periodoId)
      },
      select: {
        dia_semana: true,
        hora_inicio: true,
        hora_fin: true,
        disponible: true
      }
    });

    return NextResponse.json(disponibilidad);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener disponibilidad" }, { status: 500 });
  }
}
