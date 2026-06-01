import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const carga = await prisma.cargaNoLectiva.create({
      data: {
        id_declaracion: data.id_declaracion,
        tipo: data.tipo,
        descripcion: data.descripcion || null,
        horas_semanales: data.horas_semanales
      }
    });
    return NextResponse.json(carga);
  } catch (error) {
    console.error('Error en POST /api/carga-no-lectiva:', error);
    return NextResponse.json({ error: 'Error al crear carga no lectiva' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    await prisma.cargaNoLectiva.delete({ where: { id_carga_no_lectiva: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/carga-no-lectiva:', error);
    return NextResponse.json({ error: 'Error al eliminar carga no lectiva' }, { status: 500 });
  }
}
