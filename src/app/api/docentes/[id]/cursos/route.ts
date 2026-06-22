import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id_docente = parseInt(idStr);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id_docente = parseInt(idStr);
    const data = await request.json(); // Array of { id_curso, tipo_clase }

    // Normalizar datos y filtrar duplicados (por si acaso)
    const normalizedData = data.map((item: any) => ({
      id_curso: item.id_curso,
      tipo_clase: item.tipo_clase.toLowerCase()
    }));

    // Eliminar cursos actuales (o marcarlos como inactivos)
    await prisma.docenteCurso.updateMany({
      where: { id_docente },
      data: { activo: false }
    });

    // Crear nuevas relaciones con validación de maximo_docentes
    const created = [];
    for (const item of normalizedData) {
      // 1. Obtener curso y sus docentes actuales
      const curso = await prisma.curso.findUnique({
        where: { id_curso: item.id_curso },
        include: { 
          docente_cursos: { 
            where: { activo: true, tipo_clase: item.tipo_clase } 
          } 
        }
      });

      if (!curso) continue;

      // 2. Verificar si el docente ya está asignado (para no contar doble)
      const yaAsignado = curso.docente_cursos.some(dc => dc.id_docente === id_docente);

      // 3. Validar capacidad si no está asignado
      if (!yaAsignado && curso.docente_cursos.length >= curso.maximo_docentes) {
        // Podríamos lanzar error o simplemente omitir. 
        // Para este caso, lanzaremos un error informativo para el primer curso que falle.
        return NextResponse.json(
          { error: `El curso ${curso.nombre} (${item.tipo_clase}) ya alcanzó el máximo de ${curso.maximo_docentes} docentes.` }, 
          { status: 400 }
        );
      }

      const res = await prisma.docenteCurso.upsert({
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
      });
      created.push(res);
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al asignar cursos al docente' }, { status: 500 });
  }
}
