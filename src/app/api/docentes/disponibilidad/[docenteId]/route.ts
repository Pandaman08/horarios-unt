import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docenteId: string }> }
) {
  try {
    const { docenteId } = await params;
    const parsedDocenteId = parseInt(docenteId);
    const { searchParams } = new URL(req.url);
    const periodoId = searchParams.get("periodoId");

    if (!periodoId) {
      return NextResponse.json({ error: "periodoId es obligatorio" }, { status: 400 });
    }

    const disponibilidad = await prisma.disponibilidadDocente.findMany({
      where: {
        id_docente: parsedDocenteId,
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
