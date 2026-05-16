import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const id_ambiente = searchParams.get('id_ambiente');

    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const where: any = { id_periodo: parseInt(id_periodo) };
    if (id_ambiente) where.id_ambiente = parseInt(id_ambiente);

    // Obtener asignaciones definitivas
    const asignaciones = await prisma.horarioAsignado.findMany({
      where,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    // Obtener selecciones temporales vigentes
    const temporales = await prisma.seleccionTemporalHorario.findMany({
      where: {
        ...where,
        fecha_expiracion: { gt: new Date() }
      },
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    return NextResponse.json({
      asignaciones,
      temporales
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }
}
