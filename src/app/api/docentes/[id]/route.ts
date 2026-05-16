import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const docente = await prisma.docente.findUnique({
      where: { id_docente: id },
      include: {
        docente_cursos: {
          include: {
            curso: true
          }
        }
      }
    });
    if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
    return NextResponse.json(docente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener docente' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    const docente = await prisma.docente.update({
      where: { id_docente: id },
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        modalidad: data.modalidad,
        categoria: data.categoria,
        dedicacion: data.dedicacion,
        antiguedad: parseInt(data.antiguedad) || 0,
        fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : null,
        correo_electronico: data.correo_electronico,
        telefono: data.telefono,
        grado_academico: data.grado_academico,
        especialidad: data.especialidad,
        horas_maximas_semanales: parseInt(data.horas_maximas_semanales) || 40,
        activo: data.activo
      }
    });
    return NextResponse.json(docente);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar docente' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    // Soft delete
    await prisma.docente.update({
      where: { id_docente: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Docente eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar docente' }, { status: 500 });
  }
}
