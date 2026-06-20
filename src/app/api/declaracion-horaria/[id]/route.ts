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

    const dedicacion = data.dedicacion ?? declaracionActual.dedicacion;
    const horasDedicacion = data.horas_dedicacion ?? declaracionActual.horas_dedicacion;
    const nuevoEstado = data.estado ?? declaracionActual.estado;

    if (data.dedicacion !== undefined || data.horas_dedicacion !== undefined) {
      const horasDedicacionEsperadas = dedicacion.includes('40')
        ? 40
        : dedicacion.includes('20')
          ? 20
          : horasDedicacion;

      if (horasDedicacion !== horasDedicacionEsperadas) {
        return NextResponse.json(
          { error: `Las horas de dedicación deben ser exactamente ${horasDedicacionEsperadas} para la modalidad seleccionada.` },
          { status: 400 }
        );
      }
    }

    if (nuevoEstado === 'ENVIADO' || nuevoEstado === 'APROBADO') {
      const totalLectivas = declaracionActual.cargas_lectivas.reduce(
        (sum, c) => sum + c.horas_semanales * (c.grupos_asignados || 1),
        0
      );
      const totalNoLectivas = declaracionActual.cargas_no_lectivas.reduce(
        (sum, c) => sum + c.horas_semanales,
        0
      );
      const totalGeneral = totalLectivas + totalNoLectivas;

      if (totalGeneral !== horasDedicacion) {
        return NextResponse.json(
          { error: `La suma total de horas (${totalGeneral}h) debe ser exactamente igual a las horas de dedicación (${horasDedicacion}h).` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      fecha_actualizacion: new Date()
    };

    if (data.ibm !== undefined) updateData.ibm = data.ibm;
    if (data.condicion !== undefined) updateData.condicion = data.condicion;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.dedicacion !== undefined) updateData.dedicacion = data.dedicacion;
    if (data.horas_dedicacion !== undefined) updateData.horas_dedicacion = data.horas_dedicacion;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;
    if (nuevoEstado === 'ENVIADO') updateData.fecha_envio = new Date();
    if (nuevoEstado === 'APROBADO') updateData.fecha_aprobacion = new Date();

    const declaracion = await prisma.declaracionHoraria.update({
      where: { id_declaracion: idNum },
      data: updateData
    });

    if (nuevoEstado === 'APROBADO') {
      for (const carga of declaracionActual.cargas_lectivas) {
        await prisma.docenteCurso.upsert({
          where: {
            id_docente_id_curso_tipo_clase: {
              id_docente: declaracionActual.id_docente,
              id_curso: carga.id_curso,
              tipo_clase: carga.tipo_clase
            }
          },
          update: { activo: true },
          create: {
            id_docente: declaracionActual.id_docente,
            id_curso: carga.id_curso,
            tipo_clase: carga.tipo_clase,
            activo: true
          }
        });
      }
    }

    return NextResponse.json(declaracion);
  } catch (error) {
    console.error('Error en PUT /api/declaracion-horaria/[id]:', error);
    return NextResponse.json({ error: 'Error al actualizar declaración' }, { status: 500 });
  }
}
