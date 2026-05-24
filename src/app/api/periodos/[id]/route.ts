import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: id }
    });
    if (!periodo) return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener periodo' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();
    const periodo = await prisma.periodoAcademico.update({
      where: { id_periodo: id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        anio: parseInt(data.anio),
        semestre: parseInt(data.semestre),
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
        fecha_inicio_clases: data.fecha_inicio_clases ? new Date(data.fecha_inicio_clases) : null,
        fecha_fin_clases: data.fecha_fin_clases ? new Date(data.fecha_fin_clases) : null,
        estado: data.estado,
        activo: data.activo
      }
    });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar periodo' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Verificar dependencias antes de eliminar
    const [grupos, asignaciones, selecciones, ventanas, disponibilidad, conflictos] = await Promise.all([
      prisma.grupo.count({ where: { id_periodo: id } }),
      prisma.horarioAsignado.count({ where: { id_periodo: id } }),
      prisma.seleccionTemporalHorario.count({ where: { id_periodo: id } }),
      prisma.ventanaAtencion.count({ where: { id_periodo: id } }),
      prisma.disponibilidadDocente.count({ where: { id_periodo: id } }),
      prisma.conflictoHorario.count({ where: { id_periodo: id } })
    ]);

    if (grupos > 0 || asignaciones > 0 || selecciones > 0 || ventanas > 0 || disponibilidad > 0 || conflictos > 0) {
      let mensaje = "No se puede eliminar el periodo porque tiene dependencias:";
      if (grupos > 0) mensaje += ` ${grupos} grupos.`;
      if (asignaciones > 0) mensaje += ` ${asignaciones} horarios asignados.`;
      if (selecciones > 0) mensaje += ` ${selecciones} selecciones temporales.`;
      if (ventanas > 0) mensaje += ` ${ventanas} ventanas de atención.`;
      if (disponibilidad > 0) mensaje += ` ${disponibilidad} registros de disponibilidad.`;
      if (conflictos > 0) mensaje += ` ${conflictos} conflictos registrados.`;
      
      return NextResponse.json({ error: mensaje }, { status: 400 });
    }

    await prisma.periodoAcademico.update({
      where: { id_periodo: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Periodo eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar periodo' }, { status: 500 });
  }
}
