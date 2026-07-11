import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('[GET /api/mallas-curriculares] Fetching all active mallas');
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');

    const where: { activo: boolean; OR?: object[]; departamentoId?: string } = { activo: true };
    if (departamentoId) {
      const depto = await prisma.departamentoAcademico.findUnique({
        where: { id: departamentoId },
        select: { facultadId: true },
      });
      if (depto?.facultadId) {
        where.OR = [
          { departamentoId },
          { departamento: { facultadId: depto.facultadId } },
        ];
      } else {
        where.departamentoId = departamentoId;
      }
    }

    const mallas = await prisma.mallaCurricular.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    console.log('[GET /api/mallas-curriculares] Found', mallas.length, 'mallas');
    return NextResponse.json(mallas);
  } catch (error) {
    console.error('[GET /api/mallas-curriculares] Error:', error);
    return NextResponse.json({ error: 'Error al obtener mallas curriculares' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[POST /api/mallas-curriculares] Creating new malla');
    const body = await request.json();
    const malla = await prisma.mallaCurricular.create({
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        anio: Number(body.anio),
        departamentoId: body.departamentoId,
        facultadId: body.facultadId,
        escuelaId: body.escuelaId
      }
    });
    console.log('[POST /api/mallas-curriculares] Malla created with id:', malla.id_malla);
    return NextResponse.json(malla);
  } catch (error) {
    console.error('[POST /api/mallas-curriculares] Error:', error);
    return NextResponse.json({ error: 'Error al crear malla curricular' }, { status: 500 });
  }
}
