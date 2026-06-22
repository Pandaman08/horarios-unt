import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('[GET /api/plan-estudios] Fetching ciclos and cursos');
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamentoId');
    const facultadId = searchParams.get('facultadId');
    const mallaId = searchParams.get('mallaId');

    // Get the Mallas first to know which to show
    const mallas = await prisma.mallaCurricular.findMany({
      where: {
        activo: true,
        ...(departamentoId ? { departamentoId } : {})
      }
    });
    const availableMallaIds = mallas.map(m => m.id_malla);

    // Build where clause for cursos - filter by mallaId and/or departamento's mallas
    const cursoWhere: any = {
      activo: true,
      ...(mallaId
        ? { id_malla: parseInt(mallaId) }
        : { id_malla: { in: availableMallaIds } }
      )
    };

    const ciclos = await prisma.ciclo.findMany({
      where: { activo: true },
      orderBy: { numero: 'asc' },
      include: {
        cursos: {
          where: cursoWhere,
          orderBy: { codigo: 'asc' },
          include: {
            prerequisitos_rel: {
              include: {
                prerequisito: {
                  select: {
                    id_curso: true,
                    codigo: true,
                    nombre: true
                  }
                }
              }
            },
            malla_rel: true,
            departamento: true
          }
        }
      }
    });
    console.log('[GET /api/plan-estudios] Found', ciclos.length, 'ciclos');
    return NextResponse.json(ciclos);
  } catch (error) {
    console.error('[GET /api/plan-estudios] Error:', error);
    return NextResponse.json({ error: 'Error al obtener plan de estudios' }, { status: 500 });
  }
}
