import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const periodo = await prisma.periodoAcademico.findFirst({
      where: { activo: true },
      orderBy: { id_periodo: 'desc' },
    });

    if (!periodo) {
      return NextResponse.json({ error: "No hay periodos activos" }, { status: 404 });
    }

    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener periodo activo" }, { status: 500 });
  }
}
