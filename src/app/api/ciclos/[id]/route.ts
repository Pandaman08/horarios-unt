import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const data = await request.json();
    
    const ciclo = await prisma.ciclo.update({
      where: { id_ciclo: id },
      data: {
        numero: parseInt(data.numero.toString()),
        nombre: data.nombre,
        activo: data.activo
      }
    });
    return NextResponse.json(ciclo);
  } catch (error) {
    console.error("Error al actualizar ciclo:", error);
    return NextResponse.json({ error: 'Error al actualizar ciclo' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Verificar si tiene cursos o grupos asociados
    const [cursos, grupos] = await Promise.all([
      prisma.curso.count({ where: { id_ciclo: id } }),
      prisma.grupo.count({ where: { id_ciclo: id } })
    ]);

    if (cursos > 0 || grupos > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el ciclo porque tiene ${cursos} cursos y ${grupos} grupos asociados.` 
      }, { status: 400 });
    }

    await prisma.ciclo.update({
      where: { id_ciclo: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Ciclo eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar ciclo' }, { status: 500 });
  }
}
