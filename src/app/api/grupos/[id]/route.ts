import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const grupo = await prisma.grupo.findUnique({
      where: { id_grupo: id },
      include: {
        curso: true,
        periodo: true
      }
    });
    if (!grupo) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    return NextResponse.json(grupo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener grupo' }, { status: 500 });
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
    const capacidadMaxima = parseInt(data.capacidad_maxima);
    const cantidadMatriculados = parseInt(data.cantidad_matriculados);
    
    const grupo = await prisma.grupo.update({
      where: { id_grupo: id },
      data: {
        id_curso: parseInt(data.id_curso),
        id_periodo: parseInt(data.id_periodo),
        codigo_grupo: data.codigo_grupo,
        capacidad_maxima: capacidadMaxima,
        cantidad_matriculados: cantidadMatriculados,
        activo: data.activo
      }
    });

    // Check for warning condition
    let warning = null;
    if (capacidadMaxima < 8 || capacidadMaxima > 60) {
      warning = "Fuera del rango permitido (8-60 alumnos), Disposición Complementaria Segunda del Reglamento CAD";
    }

    return NextResponse.json({ grupo, warning });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar grupo' }, { status: 500 });
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
    const [asignaciones, selecciones] = await Promise.all([
      prisma.horarioAsignado.count({ where: { id_grupo: id } }),
      prisma.seleccionTemporalHorario.count({ where: { id_grupo: id } })
    ]);

    if (asignaciones > 0 || selecciones > 0) {
      let mensaje = "No se puede eliminar el grupo porque tiene dependencias:";
      if (asignaciones > 0) mensaje += ` ${asignaciones} horarios asignados.`;
      if (selecciones > 0) mensaje += ` ${selecciones} selecciones temporales.`;
      
      return NextResponse.json({ error: mensaje }, { status: 400 });
    }

    await prisma.grupo.update({
      where: { id_grupo: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Grupo eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar grupo' }, { status: 500 });
  }
}
