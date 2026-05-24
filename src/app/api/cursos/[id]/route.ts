import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const curso = await prisma.curso.findUnique({
      where: { id_curso: id },
      include: {
        curso_ambientes: {
          include: {
            ambiente: true
          }
        }
      }
    });
    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    return NextResponse.json(curso);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener curso' }, { status: 500 });
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
    const curso = await prisma.curso.update({
      where: { id_curso: id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        horas_teoria: parseInt(data.horas_teoria) || 0,
        horas_laboratorio: parseInt(data.horas_laboratorio) || 0,
        horas_practica: parseInt(data.horas_practica) || 0,
        creditos: parseInt(data.creditos) || 0,
        id_ciclo: parseInt(data.id_ciclo) || null,
        tipo_curso: data.tipo_curso || "linea_carrera",
        plan_estudios: data.plan_estudios,
        prerequisitos: data.prerequisitos,
        activo: data.activo
      }
    });
    return NextResponse.json(curso);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 });
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
    const [docentes, grupos, asignaciones, selecciones, ambientes] = await Promise.all([
      prisma.docenteCurso.count({ where: { id_curso: id } }),
      prisma.grupo.count({ where: { id_curso: id } }),
      prisma.horarioAsignado.count({ where: { id_curso: id } }),
      prisma.seleccionTemporalHorario.count({ where: { id_curso: id } }),
      prisma.cursoAmbiente.count({ where: { id_curso: id } })
    ]);

    if (docentes > 0 || grupos > 0 || asignaciones > 0 || selecciones > 0 || ambientes > 0) {
      let mensaje = "No se puede eliminar el curso porque tiene dependencias:";
      if (docentes > 0) mensaje += ` ${docentes} docentes asignados.`;
      if (grupos > 0) mensaje += ` ${grupos} grupos creados.`;
      if (asignaciones > 0) mensaje += ` ${asignaciones} horarios asignados.`;
      if (selecciones > 0) mensaje += ` ${selecciones} selecciones temporales.`;
      if (ambientes > 0) mensaje += ` ${ambientes} ambientes vinculados.`;
      
      return NextResponse.json({ error: mensaje }, { status: 400 });
    }

    await prisma.curso.update({
      where: { id_curso: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Curso eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar curso' }, { status: 500 });
  }
}
