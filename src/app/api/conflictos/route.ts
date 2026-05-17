import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodoId = searchParams.get('periodoId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  if (!periodoId) {
    return NextResponse.json({ error: 'Falta periodoId' }, { status: 400 });
  }

  try {
    const [conflictos, total] = await Promise.all([
      prisma.conflictoHorario.findMany({
        where: { id_periodo: parseInt(periodoId) },
        orderBy: { fecha_deteccion: 'desc' },
        skip,
        take: limit,
      }),
      prisma.conflictoHorario.count({
        where: { id_periodo: parseInt(periodoId) }
      })
    ]);

    return NextResponse.json({
      data: conflictos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener listado de conflictos' }, { status: 500 });
  }
}
