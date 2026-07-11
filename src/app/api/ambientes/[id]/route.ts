import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const ambiente = await prisma.ambiente.findUnique({
      where: { id_ambiente: id },
      include: { facultad: true }
    });
    if (!ambiente) return NextResponse.json({ error: 'Ambiente no encontrado' }, { status: 404 });
    return NextResponse.json(ambiente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ambiente' }, { status: 500 });
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
    const ambiente = await prisma.ambiente.update({
      where: { id_ambiente: id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        tipo: data.tipo,
        capacidad: parseInt(data.capacidad),
        piso: data.piso,
        pabellon: data.pabellon,
        equipamiento: data.equipamiento,
        caracteristicas: data.caracteristicas || {},
        activo: data.activo,
        requiere_mantenimiento: data.requiere_mantenimiento,
        observaciones: data.observaciones,
        facultadId: data.facultadId || null
      }
    });
    return NextResponse.json(ambiente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar ambiente' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Verificar dependencias antes de eliminar (incluso para soft delete)
    const [asignaciones, selecciones, cursosRelacionados] = await Promise.all([
      prisma.horarioAsignado.count({ where: { id_ambiente: id } }),
      prisma.seleccionTemporalHorario.count({ where: { id_ambiente: id } }),
      prisma.cursoAmbiente.count({ where: { id_ambiente: id } })
    ]);

    if (asignaciones > 0 || selecciones > 0 || cursosRelacionados > 0) {
      let mensaje = "No se puede eliminar el ambiente porque tiene dependencias:";
      if (asignaciones > 0) mensaje += ` ${asignaciones} horarios asignados.`;
      if (selecciones > 0) mensaje += ` ${selecciones} selecciones temporales.`;
      if (cursosRelacionados > 0) mensaje += ` ${cursosRelacionados} cursos vinculados.`;
      
      return NextResponse.json({ error: mensaje }, { status: 400 });
    }

    await prisma.ambiente.update({
      where: { id_ambiente: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Ambiente eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar ambiente' }, { status: 500 });
  }
}
