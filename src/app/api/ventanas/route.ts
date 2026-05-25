import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');

    if (!id_periodo) {
      return NextResponse.json(
        { error: 'id_periodo es requerido' },
        { status: 400 }
      );
    }

    // Obtener ventanas de la BD
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: parseInt(id_periodo) },
      orderBy: { orden_prioridad: 'asc' }
    });

    // Obtener docentes para asociar con las ventanas (solo los que tienen grupos en el período)
    const docentes = await prisma.docente.findMany({
      where: { 
        activo: true,
        docente_cursos: {
          some: {
            activo: true,
            curso: {
              grupos: {
                some: {
                  id_periodo: parseInt(id_periodo)
                }
              }
            }
          }
        }
      },
      orderBy: [
        { modalidad: 'desc' }, // Nombrado primero
        { categoria: 'desc' }, // Principal primero
        { fecha_ingreso: 'asc' } // Más viejo primero
      ]
    });

    // Asociar cada ventana con un docente
    const ventanasConDocentes = ventanas.map((ventana, index) => ({
      ...ventana,
      docente: docentes[index] || null
    }));

    return NextResponse.json({ ventanas: ventanasConDocentes });

  } catch (error: any) {
    console.error('Error al obtener ventanas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}
