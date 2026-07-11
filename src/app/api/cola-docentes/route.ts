import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo_str = searchParams.get('id_periodo');
    if (!id_periodo_str) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    const id_periodo = parseInt(id_periodo_str);
    if (isNaN(id_periodo)) return NextResponse.json({ error: 'id_periodo inválido' }, { status: 400 });

    const ahora = new Date();
    const horaActualStr = ahora.toLocaleTimeString('en-GB', {
      timeZone: 'America/Lima',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const hoyPeru = ahora.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
    const [year, month, day] = hoyPeru.split('-').map(Number);
    const fechaInicio = new Date(Date.UTC(year, month - 1, day, 5, 0, 0)); // Peru midnight
    const fechaFin = new Date(Date.UTC(year, month - 1, day + 1, 5, 0, 0)); // Siguiente Peru midnight

    // 1. Obtener ventanas activas en este momento (en Peru timezone)
    const ventanasActivas = await prisma.ventanaAtencion.findMany({
      where: {
        id_periodo: id_periodo,
        activo: true,
        fecha: { gte: fechaInicio, lt: fechaFin },
        hora_inicio: { lte: horaActualStr },
        hora_fin: { gte: horaActualStr }
      }
    });

    if (ventanasActivas.length === 0) {
      return NextResponse.json({ docentes: [], mensaje: 'No hay ventanas de atención activas en este momento.' });
    }

    // 2. Obtener docentes que pertenecen a esas ventanas (modalidad y categoría)
    // y que tengan al menos un curso asignado para dictar
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        docente_cursos: {
          some: {
            activo: true
          }
        },
        OR: ventanasActivas.map((v: any) => ({
          condicion: v.modalidad,
          categoriaDocente: v.categoria
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
          { condicion: 'asc' },
          { categoriaDocente: 'asc' },
          { fecha_ingreso: 'asc' }
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
