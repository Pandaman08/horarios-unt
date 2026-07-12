import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const departamento = await prisma.departamentoAcademico.findUnique({
      where: { id },
      include: {
        facultad: true,
      }
    });
    if (!departamento) {
      return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 });
    }
    return NextResponse.json(departamento);
  } catch (error) {
    console.error("Error al obtener departamento:", error);
    return NextResponse.json({ error: 'Error al obtener departamento' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const departamento = await prisma.departamentoAcademico.update({
      where: { id },
      data: {
        nombre: data.nombre,
        facultadId: data.facultadId,
      }
    });
    return NextResponse.json(departamento);
  } catch (error) {
    console.error("Error al actualizar departamento:", error);
    return NextResponse.json({ error: 'Error al actualizar departamento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check for related records
    const hasDocentes = await prisma.docente.count({ where: { departamentoId: id } });

    if (hasDocentes > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el departamento porque tiene docentes asignados' 
      }, { status: 400 });
    }

    await prisma.departamentoAcademico.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Departamento eliminado correctamente' });
  } catch (error) {
    console.error("Error al eliminar departamento:", error);
    return NextResponse.json({ error: 'Error al eliminar departamento' }, { status: 500 });
  }
}
