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
    const grupo = await prisma.grupo.update({
      where: { id_grupo: id },
      data: {
        id_curso: parseInt(data.id_curso),
        id_periodo: parseInt(data.id_periodo),
        codigo_grupo: data.codigo_grupo,
        capacidad_maxima: parseInt(data.capacidad_maxima),
        cantidad_matriculados: parseInt(data.cantidad_matriculados),
        activo: data.activo
      }
    });
    return NextResponse.json(grupo);
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
    await prisma.grupo.update({
      where: { id_grupo: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Grupo eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar grupo' }, { status: 500 });
  }
}
