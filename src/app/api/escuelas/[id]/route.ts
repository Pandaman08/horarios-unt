import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const escuela = await prisma.escuelaProfesional.findUnique({
      where: { id: params.id },
      include: {
        facultad: true,
      }
    });
    if (!escuela) {
      return NextResponse.json({ error: 'Escuela no encontrada' }, { status: 404 });
    }
    return NextResponse.json(escuela);
  } catch (error) {
    console.error("Error al obtener escuela:", error);
    return NextResponse.json({ error: 'Error al obtener escuela' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const data = await request.json();
    const escuela = await prisma.escuelaProfesional.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre,
        facultadId: data.facultadId,
      }
    });
    return NextResponse.json(escuela);
  } catch (error) {
    console.error("Error al actualizar escuela:", error);
    return NextResponse.json({ error: 'Error al actualizar escuela' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    // Check for related records
    const hasMallas = await prisma.mallaCurricular.count({ where: { escuelaId: params.id } });
    const hasCursos = await prisma.curso.count({ where: { escuelaId: params.id } });

    if (hasMallas > 0 || hasCursos > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar la escuela porque tiene mallas curriculares o cursos asignados' 
      }, { status: 400 });
    }

    await prisma.escuelaProfesional.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ message: 'Escuela eliminada correctamente' });
  } catch (error) {
    console.error("Error al eliminar escuela:", error);
    return NextResponse.json({ error: 'Error al eliminar escuela' }, { status: 500 });
  }
}
