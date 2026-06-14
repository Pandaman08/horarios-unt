import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const idNum = parseInt(id);

    // 1. Validar horas de dedicación obligatorias
    const horasDedicacionEsperadas = data.dedicacion.includes('40') ? 40 : (data.dedicacion.includes('20') ? 20 : data.horas_dedicacion);
    
    if (data.horas_dedicacion !== horasDedicacionEsperadas) {
      return NextResponse.json(
        { error: `Las horas de dedicación deben ser exactamente ${horasDedicacionEsperadas} para la modalidad seleccionada.` },
        { status: 400 }
      );
    }

    // 2. Si se intenta enviar o aprobar, validar que la suma de cargas coincida
    if (data.estado === 'ENVIADO' || data.estado === 'APROBADO') {
      const declaracionActual = await prisma.declaracionHoraria.findUnique({
        where: { id_declaracion: idNum },
        include: {
          cargas_lectivas: true,
          cargas_no_lectivas: true
        }
      });

      if (!declaracionActual) {
        return NextResponse.json({ error: 'Declaración no encontrada' }, { status: 404 });
      }

      const totalLectivas = declaracionActual.cargas_lectivas.reduce(
        (sum, c) => sum + (c.horas_semanales * (c.grupos_asignados || 1)), 0
      );
      const totalNoLectivas = declaracionActual.cargas_no_lectivas.reduce(
        (sum, c) => sum + c.horas_semanales, 0
      );
      const totalGeneral = totalLectivas + totalNoLectivas;

      if (totalGeneral !== data.horas_dedicacion) {
        return NextResponse.json(
          { error: `La suma total de horas (${totalGeneral}h) debe ser exactamente igual a las horas de dedicación (${data.horas_dedicacion}h).` },
          { status: 400 }
        );
      }
    }

    const declaracion = await prisma.declaracionHoraria.update({
      where: { id_declaracion: idNum },
      data: {
        ibm: data.ibm,
        condicion: data.condicion,
        categoria: data.categoria,
        dedicacion: data.dedicacion,
        horas_dedicacion: data.horas_dedicacion,
        estado: data.estado,
        observaciones: data.observaciones,
        fecha_envio: data.estado === 'ENVIADO' ? new Date() : undefined,
        fecha_aprobacion: data.estado === 'APROBADO' ? new Date() : undefined,
        fecha_actualizacion: new Date()
      }
    });
    return NextResponse.json(declaracion);
  } catch (error) {
    console.error('Error en PUT /api/declaracion-horaria/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar declaración' }, { status: 500 });
  }
}
