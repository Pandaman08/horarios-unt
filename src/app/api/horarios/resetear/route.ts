import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { id_periodo } = await request.json();

    if (!id_periodo) {
      return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar todos los horarios asignados para el periodo
      await tx.horarioAsignado.deleteMany({
        where: {
          id_periodo: parseInt(id_periodo)
        }
      });

      // 2. Reiniciar las selecciones temporales para el periodo
      await tx.seleccionTemporalHorario.deleteMany({
        where: {
          id_periodo: parseInt(id_periodo)
        }
      });
    });

    return NextResponse.json({ 
      message: 'Horarios reseteados exitosamente. Los docentes pueden volver a confirmar.',
      id_periodo: id_periodo
    });
  } catch (error) {
    console.error('Error al resetear horarios:', error);
    return NextResponse.json(
      { error: 'Error al resetear horarios' },
      { status: 500 }
    );
  }
}
