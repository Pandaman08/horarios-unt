import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodoId = searchParams.get('periodoId');

  if (!periodoId) {
    return NextResponse.json({ error: 'Falta periodoId' }, { status: 400 });
  }

  try {
    const count = await prisma.conflictoHorario.count({
      where: {
        id_periodo: parseInt(periodoId),
        resuelto: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener conflictos pendientes' }, { status: 500 });
  }
}
