import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo_str = searchParams.get('id_periodo');
    if (!id_periodo_str) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const id_periodo = parseInt(id_periodo_str);
    if (isNaN(id_periodo)) return NextResponse.json({ error: 'id_periodo inválido' }, { status: 400 });

    const ahora = new Date();
    const horaActualStr = format(ahora, 'HH:mm');
    
    // Normalizar fecha a mediodía UTC para coincidir con el almacenamiento de VentanaAtencion
    const hoySoloFechaStr = format(ahora, 'yyyy-MM-dd');
    const fechaActual = new Date(hoySoloFechaStr + 'T12:00:00Z');

    // 1. Obtener ventanas activas en este momento
    const ventanasActivas = await prisma.ventanaAtencion.findMany({
      where: {
        id_periodo: id_periodo,
        activo: true,
        fecha: { equals: fechaActual },
        hora_inicio: { lte: horaActualStr },
        hora_fin: { gte: horaActualStr }
      }
    });

    if (ventanasActivas.length === 0) {
      return NextResponse.json({ docentes: [], mensaje: 'No hay ventanas de atención activas en este momento.' });
    }

    // 2. Obtener docentes que pertenecen a esas ventanas (modalidad y categoría)
    // y que no hayan completado su horario aún (simplificado: que no tengan todas sus horas asignadas)
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        OR: ventanasActivas.map(v => ({
          modalidad: v.modalidad,
          categoria: v.categoria
        }))
      },
      include: {
        docente_cursos: {
          include: { curso: true }
        },
        horarios_asignados: {
          where: { id_periodo: id_periodo }
        }
      },
      orderBy: [
        { modalidad: 'asc' },
        { categoria: 'asc' },
        { antiguedad: 'desc' }
      ]
    });

    // Filtrar docentes que ya completaron su horario (opcional, pero recomendado)
    // Por ahora los devolvemos todos y el operador decide.

    return NextResponse.json({ docentes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener cola de docentes' }, { status: 500 });
  }
}
