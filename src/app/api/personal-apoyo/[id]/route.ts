import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const personalApoyo = await prisma.personalApoyo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        modalidad: data.modalidad,
        departamentoId: data.departamentoId || null,
      },
    });

    return NextResponse.json(personalApoyo);
  } catch (error) {
    console.error('Error al actualizar personal de apoyo:', error);
    return NextResponse.json({ error: 'Error al actualizar personal de apoyo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.personalApoyo.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Personal de apoyo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar personal de apoyo:', error);
    return NextResponse.json({ error: 'Error al eliminar personal de apoyo' }, { status: 500 });
  }
}
