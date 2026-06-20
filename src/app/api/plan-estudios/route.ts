import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[GET /api/plan-estudios] Fetching ciclos and cursos');
    const ciclos = await prisma.ciclo.findMany({
      where: { activo: true },
      orderBy: { numero: 'asc' },
      include: {
        cursos: {
          where: { activo: true },
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
            malla_rel: true
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
