import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[PUT /api/mallas-curriculares/:id] Updating malla');
    const { id } = await params;
    const body = await request.json();
    const malla = await prisma.mallaCurricular.update({
      where: { id_malla: parseInt(id) },
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        anio: Number(body.anio),
        activo: body.activo,
        departamentoId: body.departamentoId
      }
    });
    console.log('[PUT /api/mallas-curriculares/:id] Malla updated');
    return NextResponse.json(malla);
  } catch (error) {
    console.error('[PUT /api/mallas-curriculares/:id] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar malla curricular' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[DELETE /api/mallas-curriculares/:id] Soft deleting malla');
    const { id } = await params;
    // Soft delete
    await prisma.mallaCurricular.update({
      where: { id_malla: parseInt(id) },
      data: { activo: false }
    });
    console.log('[DELETE /api/mallas-curriculares/:id] Malla soft deleted');
    return NextResponse.json({ message: 'Malla curricular eliminada' });
  } catch (error) {
    console.error('[DELETE /api/mallas-curriculares/:id] Error:', error);
    return NextResponse.json({ error: 'Error al eliminar malla curricular' }, { status: 500 });
  }
}
