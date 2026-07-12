
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const idCurso = parseInt(idStr);
    const { searchParams } = new URL(request.url);
    const periodoId = searchParams.get('periodoId');

    if (!periodoId) {
      return NextResponse.json(
        { error: 'periodoId es requerido' },
        { status: 400 }
      );
    }

    const grupos = await prisma.grupo.findMany({
      where: {
        id_curso: idCurso,
        id_periodo: parseInt(periodoId),
        activo: true,
      },
    });

    return NextResponse.json(grupos);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
