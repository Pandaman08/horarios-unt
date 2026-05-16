import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: id }
    });
    if (!periodo) return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener periodo' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    const periodo = await prisma.periodoAcademico.update({
      where: { id_periodo: id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        anio: parseInt(data.anio),
        semestre: parseInt(data.semestre),
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
        fecha_inicio_clases: data.fecha_inicio_clases ? new Date(data.fecha_inicio_clases) : null,
        fecha_fin_clases: data.fecha_fin_clases ? new Date(data.fecha_fin_clases) : null,
        estado: data.estado,
        activo: data.activo
      }
    });
    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar periodo' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.periodoAcademico.update({
      where: { id_periodo: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Periodo eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar periodo' }, { status: 500 });
  }
}
