import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const ventana = await prisma.ventanaAtencion.findUnique({
      where: { id_ventana: id },
      include: { periodo: true }
    });
    if (!ventana) return NextResponse.json({ error: 'Ventana no encontrada' }, { status: 404 });
    return NextResponse.json(ventana);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ventana' }, { status: 500 });
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
    const ventana = await prisma.ventanaAtencion.update({
      where: { id_ventana: id },
      data: {
        fecha: new Date(data.fecha),
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        modalidad: data.modalidad,
        categoria: data.categoria,
        orden_prioridad: parseInt(data.orden_prioridad),
        intervalo_minutos: parseInt(data.intervalo_minutos),
        completado: data.completado,
        activo: data.activo
      }
    });
    return NextResponse.json(ventana);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar ventana' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.ventanaAtencion.update({
      where: { id_ventana: id },
      data: { activo: false }
    });
    return NextResponse.json({ message: 'Ventana eliminada' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar ventana' }, { status: 500 });
  }
}
