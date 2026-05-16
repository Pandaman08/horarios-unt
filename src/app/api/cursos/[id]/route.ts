import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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
        ciclo: parseInt(data.ciclo) || null,
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
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.curso.update({
      where: { id_curso: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Curso eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar curso' }, { status: 500 });
  }
}
