import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('ADMINISTRADOR_SISTEMA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const cargo = await prisma.cargoAcademicoAdministrativo.update({
      where: { id: id },
      data: {
        nombre: data.nombre,
        chlm: parseInt(data.chlm),
        chnlpe: parseInt(data.chnlpe),
        chnla: parseInt(data.chnla),
      }
    });
    return NextResponse.json(cargo);
  } catch (error) {
    console.error('Error al actualizar cargo:', error);
    return NextResponse.json({ error: 'Error al actualizar cargo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('ADMINISTRADOR_SISTEMA')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.cargoAcademicoAdministrativo.delete({
      where: { id: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    return NextResponse.json({ error: 'Error al eliminar cargo' }, { status: 500 });
  }
}
