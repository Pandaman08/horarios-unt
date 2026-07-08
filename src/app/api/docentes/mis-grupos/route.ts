import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { filtrarGruposSegunCargaLectiva } from '@/lib/grupos/cargaLectivaGrupos';

async function resolveDocenteId(
  session: { user: { id_usuario: number; id_docente?: number; rol: string } },
  id_docente_manual: string | null
): Promise<number | null> {
  if (
    id_docente_manual &&
    ['administrador_sistema', 'operador_horarios', 'docente', 'secretaria'].includes(session.user.rol)
  ) {
    const parsed = parseInt(id_docente_manual, 10);
    return isNaN(parsed) ? null : parsed;
  }

  const docente = await prisma.docente.findFirst({
    where: { id_usuario: session.user.id_usuario },
  });

  if (docente) return docente.id_docente;
  if (session.user.id_docente) return Number(session.user.id_docente);
  return null;
}

function normalizeTipo(tipo: string) {
  return tipo.toLowerCase().trim();
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const id_curso = searchParams.get('id_curso');
    const tipo_clase = searchParams.get('tipo_clase');
    const id_docente_manual = searchParams.get('id_docente');

    if (!id_periodo || !id_curso || !tipo_clase) {
      return NextResponse.json(
        { error: 'Faltan id_periodo, id_curso o tipo_clase' },
        { status: 400 }
      );
    }

    const periodoId = parseInt(id_periodo, 10);
    const cursoId = parseInt(id_curso, 10);
    const docenteId = await resolveDocenteId(session, id_docente_manual);

    if (!docenteId) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
    }

    const tipoNorm = normalizeTipo(tipo_clase);

    const allGrupos = await prisma.grupo.findMany({
      where: {
        id_curso: cursoId,
        id_periodo: periodoId,
        activo: true,
      },
      orderBy: { codigo_grupo: 'asc' },
    });

    const declaracion = await prisma.declaracionHoraria.findUnique({
      where: {
        id_docente_id_periodo: {
          id_docente: docenteId,
          id_periodo: periodoId,
        },
      },
      include: {
        cargas_lectivas: {
          where: { id_curso: cursoId },
          include: { grupo: true },
        },
      },
    });

    if (declaracion?.estado === 'APROBADO') {
      const carga = declaracion.cargas_lectivas.find((c: { tipo_clase: string }) => normalizeTipo(c.tipo_clase) === tipoNorm);

      if (carga) {
        if (carga.id_grupo && carga.grupo?.activo !== false) {
          return NextResponse.json({
            grupos: [carga.grupo],
            origen: 'carga_lectiva',
            grupos_asignados: carga.grupos_asignados,
            tipo_clase: carga.tipo_clase,
          });
        }

        const gruposFiltrados = filtrarGruposSegunCargaLectiva(
          allGrupos,
          carga.tipo_clase,
          carga.grupos_asignados
        );

        return NextResponse.json({
          grupos: gruposFiltrados,
          origen: 'carga_lectiva',
          grupos_asignados: carga.grupos_asignados,
          tipo_clase: carga.tipo_clase,
        });
      }
    }

    const gruposFallback = filtrarGruposSegunCargaLectiva(allGrupos, tipo_clase);

    return NextResponse.json({
      grupos: gruposFallback,
      origen: gruposFallback.length > 0 ? 'curso' : 'ninguno',
      grupos_asignados: gruposFallback.length,
      tipo_clase,
    });
  } catch (error) {
    console.error('Error en mis-grupos:', error);
    return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 });
  }
}
