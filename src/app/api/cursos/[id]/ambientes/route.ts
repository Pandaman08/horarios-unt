import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id_curso = parseInt(params.id);
    const cursoAmbientes = await prisma.cursoAmbiente.findMany({
      where: { id_curso },
      include: { ambiente: true }
    });
    return NextResponse.json(cursoAmbientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ambientes del curso' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id_curso = parseInt(params.id);
    const data = await request.json(); // Array of { id_ambiente, tipo_clase }

    // Eliminar relaciones anteriores
    await prisma.cursoAmbiente.deleteMany({
      where: { id_curso }
    });

    // Crear nuevas relaciones
    const created = await Promise.all(
      data.map((item: any) =>
        prisma.cursoAmbiente.create({
          data: {
            id_curso,
            id_ambiente: item.id_ambiente,
            tipo_clase: item.tipo_clase
          }
        })
      )
    );

    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: 'Error al asignar ambientes al curso' }, { status: 500 });
  }
}
