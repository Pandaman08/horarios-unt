import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo') || searchParams.get('idPeriodo');
    const id_curso = searchParams.get('id_curso') || searchParams.get('idCurso');

    const where: any = { activo: true };
    if (id_periodo) where.id_periodo = parseInt(id_periodo);
    if (id_curso) where.id_curso = parseInt(id_curso);

    const grupos = await prisma.grupo.findMany({
      where,
      include: {
        curso: true,
        periodo: true
      },
      orderBy: { codigo_grupo: 'asc' }
    });
    return NextResponse.json(grupos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const grupo = await prisma.grupo.create({
      data: {
        id_curso: parseInt(data.id_curso),
        id_periodo: parseInt(data.id_periodo),
        codigo_grupo: data.codigo_grupo,
        capacidad_maxima: parseInt(data.capacidad_maxima) || 40,
        cantidad_matriculados: parseInt(data.cantidad_matriculados) || 0,
        activo: true
      }
    });
    return NextResponse.json(grupo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear grupo' }, { status: 500 });
  }
}
