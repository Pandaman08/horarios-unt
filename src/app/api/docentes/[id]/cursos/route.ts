import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id_docente = parseInt(params.id);
    const docenteCursos = await prisma.docenteCurso.findMany({
      where: { id_docente, activo: true },
      include: { curso: true }
    });
    return NextResponse.json(docenteCursos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cursos del docente' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id_docente = parseInt(params.id);
    const data = await request.json(); // Array of { id_curso, tipo_clase }

    // Eliminar cursos actuales (o marcarlos como inactivos)
    await prisma.docenteCurso.updateMany({
      where: { id_docente },
      data: { activo: false }
    });

    // Crear nuevas relaciones
    const created = await Promise.all(
      data.map((item: any) =>
        prisma.docenteCurso.upsert({
          where: {
            id_docente_id_curso_tipo_clase: {
              id_docente,
              id_curso: item.id_curso,
              tipo_clase: item.tipo_clase
            }
          },
          update: { activo: true },
          create: {
            id_docente,
            id_curso: item.id_curso,
            tipo_clase: item.tipo_clase,
            activo: true
          }
        })
      )
    );

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al asignar cursos al docente' }, { status: 500 });
  }
}
