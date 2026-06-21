import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const facultad = await prisma.facultad.findUnique({
      where: { id: params.id },
      include: {
        departamentos: true,
        escuelas: true,
      }
    });
    if (!facultad) {
      return NextResponse.json({ error: 'Facultad no encontrada' }, { status: 404 });
    }
    return NextResponse.json(facultad);
  } catch (error) {
    console.error("Error al obtener facultad:", error);
    return NextResponse.json({ error: 'Error al obtener facultad' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const data = await request.json();
    const facultad = await prisma.facultad.update({
      where: { id: params.id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        tipo: data.tipo,
      }
    });
    return NextResponse.json(facultad);
  } catch (error) {
    console.error("Error al actualizar facultad:", error);
    return NextResponse.json({ error: 'Error al actualizar facultad' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    // Check for related records
    const hasDocentes = await prisma.docente.count({ where: { facultadId: params.id } });
    const hasAmbientes = await prisma.ambiente.count({ where: { facultadId: params.id } });
    const hasDepartamentos = await prisma.departamentoAcademico.count({ where: { facultadId: params.id } });
    const hasEscuelas = await prisma.escuelaProfesional.count({ where: { facultadId: params.id } });
    const hasCargaLectiva = await prisma.cargaLectiva.count({ where: { sedeId: params.id } });
    const hasCargaNoLectiva = await prisma.cargaNoLectiva.count({ where: { sedeId: params.id } });

    if (hasDocentes > 0 || hasAmbientes > 0 || hasDepartamentos > 0 || hasEscuelas > 0 || hasCargaLectiva > 0 || hasCargaNoLectiva > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar la facultad porque tiene registros relacionados (docentes, ambientes, departamentos, escuelas o cargas horarias)' 
      }, { status: 400 });
    }

    await prisma.facultad.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ message: 'Facultad eliminada correctamente' });
  } catch (error) {
    console.error("Error al eliminar facultad:", error);
    return NextResponse.json({ error: 'Error al eliminar facultad' }, { status: 500 });
  }
}
