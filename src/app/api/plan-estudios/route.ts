import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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
            }
          }
        }
      }
    });
    return NextResponse.json(ciclos);
  } catch (error) {
    console.error('Error al obtener plan de estudios:', error);
    return NextResponse.json({ error: 'Error al obtener plan de estudios' }, { status: 500 });
  }
}
