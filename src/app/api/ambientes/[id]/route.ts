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
      where: { id_ambiente: id }
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
        observaciones: data.observaciones
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
    await prisma.ambiente.update({
      where: { id_ambiente: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Ambiente eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar ambiente' }, { status: 500 });
  }
}
