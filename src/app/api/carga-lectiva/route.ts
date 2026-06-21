import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const carga = await prisma.cargaLectiva.create({
      data: {
        id_declaracion: data.id_declaracion,
        id_curso: data.id_curso,
        id_grupo: data.id_grupo || null,
        tipo_clase: data.tipo_clase,
        horas_semanales: data.horas_semanales,
        grupos_asignados: data.grupos_asignados || null,
        sedeId: data.sedeId || null
      }
    });
    return NextResponse.json(carga);
  } catch (error) {
    console.error('Error en POST /api/carga-lectiva:', error);
    return NextResponse.json({ error: 'Error al crear carga lectiva' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    await prisma.cargaLectiva.delete({ where: { id_carga_lectiva: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/carga-lectiva:', error);
    return NextResponse.json({ error: 'Error al eliminar carga lectiva' }, { status: 500 });
  }
}
