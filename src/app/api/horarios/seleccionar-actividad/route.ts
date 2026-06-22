import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      id_carga_no_lectiva,
      dia, // DiaSemana enum (LU, MA, etc.)
      hora_inicio, // string "HH:mm"
      hora_fin, // string "HH:mm"
    } = data;

    if (!id_carga_no_lectiva || !dia || !hora_inicio || !hora_fin) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // TODO: Add validation (no conflicts, disponibilidad docente, etc.)

    const actividad = await prisma.horarioActividad.create({
      data: {
        cargaNoLectivaId: parseInt(id_carga_no_lectiva),
        dia,
        horaInicio: hora_inicio,
        horaFin: hora_fin,
      },
    });

    return NextResponse.json({ valido: true, actividad });
  } catch (error: any) {
    console.error('Error en seleccionar-actividad:', error);
    return NextResponse.json(
      { valido: false, error: error.message || 'Error al crear horario de actividad' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta id del horario' }, { status: 400 });
    }

    await prisma.horarioActividad.delete({
      where: { id: id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error en eliminar-actividad:', error);
    return NextResponse.json(
      { error: 'Error al eliminar horario de actividad' },
      { status: 500 }
    );
  }
}
