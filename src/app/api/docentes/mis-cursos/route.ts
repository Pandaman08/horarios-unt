import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function calcularMinutos(
  hInicio: string | null | undefined,
  hFin: string | null | undefined
): number {
  if (!hInicio || !hFin || !hInicio.includes(':') || !hFin.includes(':')) return 0;

  try {
    const [h1, m1] = hInicio.split(':').map(Number);
    const [h2, m2] = hFin.split(':').map(Number);

    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;

    return h2 * 60 + m2 - (h1 * 60 + m1);
  } catch {
    return 0;
  }
}

function horasRequeridasDesdeCurso(tipoClase: string, curso: {
  horas_teoria?: number | null;
  horas_laboratorio?: number | null;
  horas_practica?: number | null;
}): number {
  const tipo = tipoClase.toLowerCase();

  if (tipo.includes('teoria') || tipo.includes('teoría')) {
    return curso.horas_teoria ?? 0;
  }
  if (tipo.includes('laboratorio')) {
    return curso.horas_laboratorio ?? 0;
  }
  if (tipo.includes('practica') || tipo.includes('práctica')) {
    return curso.horas_practica ?? 0;
  }

  return 0;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const id_docente_manual = searchParams.get('id_docente_manual') || searchParams.get('id_docente');

    if (!id_periodo) {
      return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
    }

    const periodoId = parseInt(id_periodo, 10);
    if (isNaN(periodoId)) {
      return NextResponse.json({ error: 'id_periodo debe ser un número válido' }, { status: 400 });
    }

    let docenteId: number;

    if (
      id_docente_manual &&
      (
        session.user.rol === 'administrador_sistema' ||
        session.user.rol === 'operador_horarios' ||
        session.user.rol === 'docente'
      )
    ) {
      const parsedDocenteId = parseInt(id_docente_manual, 10);
      if (isNaN(parsedDocenteId)) {
        return NextResponse.json({ error: 'id_docente debe ser un número válido' }, { status: 400 });
      }
      docenteId = parsedDocenteId;
    } else {
      const docente = await prisma.docente.findFirst({
        where: { id_usuario: session.user.id_usuario },
      });

      if (!docente) {
        if (session.user.id_docente) {
          docenteId = Number(session.user.id_docente);
        } else {
          return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
        }
      } else {
        docenteId = docente.id_docente;
      }
    }

    type CursoItem = {
      id_curso: number;
      nombre: string;
      codigo: string;
      tipo_clase: string;
      horas_requeridas: number;
      grupos_asignados?: number;
      id_grupo?: number;
    };

    const cursosMap = new Map<string, CursoItem>();

    const declaracion = await prisma.declaracionHoraria.findUnique({
      where: {
        id_docente_id_periodo: {
          id_docente: docenteId,
          id_periodo: periodoId,
        },
      },
      include: {
        cargas_lectivas: {
          include: {
            curso: {
              include: {
                grupos: {
                  where: { id_periodo: periodoId, activo: true },
                },
              },
            },
          },
        },
      },
    });

    // Incluir cursos si la declaración está en APROBADO, BORRADOR, o LECTIVA_CONFIRMADA
    const estadosValidos = ['APROBADO', 'BORRADOR', 'LECTIVA_CONFIRMADA', 'ENVIADO'];
    if (declaracion && estadosValidos.includes(declaracion.estado)) {
      for (const carga of declaracion.cargas_lectivas) {
        if (!carga.curso) continue;

        const tieneGruposEnPeriodo = carga.curso.grupos.length > 0;
        const tieneGruposDeclarados =
          (carga.grupos_asignados ?? 0) > 0 || carga.id_grupo != null;

        if (!tieneGruposEnPeriodo && !tieneGruposDeclarados) continue;

        const key = `${carga.id_curso}:${carga.tipo_clase.toLowerCase().trim()}`;
        const horasDeclaradas = carga.horas_semanales * (carga.grupos_asignados || 1);

        cursosMap.set(key, {
          id_curso: carga.id_curso,
          nombre: carga.curso.nombre,
          codigo: carga.curso.codigo,
          tipo_clase: carga.tipo_clase,
          horas_requeridas: horasDeclaradas > 0
            ? horasDeclaradas
            : horasRequeridasDesdeCurso(carga.tipo_clase, carga.curso),
          grupos_asignados: carga.grupos_asignados ?? undefined,
          id_grupo: carga.id_grupo ?? undefined,
        });
      }
    }

    if (cursosMap.size === 0) {
      const cursosAsignados = await prisma.docenteCurso.findMany({
        where: { id_docente: docenteId, activo: true },
        include: {
          curso: {
            include: {
              grupos: {
                where: { id_periodo: periodoId, activo: true },
              },
            },
          },
        },
      });

      for (const dc of cursosAsignados) {
        if (!dc.curso || dc.curso.grupos.length === 0) continue;

        const key = `${dc.id_curso}:${dc.tipo_clase.toLowerCase().trim()}`;
        if (cursosMap.has(key)) continue;

        cursosMap.set(key, {
          id_curso: dc.id_curso,
          nombre: dc.curso.nombre,
          codigo: dc.curso.codigo,
          tipo_clase: dc.tipo_clase,
          horas_requeridas: horasRequeridasDesdeCurso(dc.tipo_clase, dc.curso),
        });
      }
    }

    const progreso = await Promise.all(
      Array.from(cursosMap.values()).map(async (curso) => {
        const asignaciones = await prisma.horarioAsignado.findMany({
          where: {
            id_docente: docenteId,
            id_curso: curso.id_curso,
            tipo_clase: curso.tipo_clase,
            id_periodo: periodoId,
          },
        });

        const temporales = await prisma.seleccionTemporalHorario.findMany({
          where: {
            id_docente: docenteId,
            id_curso: curso.id_curso,
            tipo_clase: curso.tipo_clase,
            id_periodo: periodoId,
            fecha_expiracion: { gt: new Date() },
          },
        });

        let minutosTotales = 0;
        asignaciones.forEach((a: { hora_inicio: string; hora_fin: string }) => {
          minutosTotales += calcularMinutos(a.hora_inicio, a.hora_fin);
        });
        temporales.forEach((t: { hora_inicio: string; hora_fin: string }) => {
          minutosTotales += calcularMinutos(t.hora_inicio, t.hora_fin);
        });

        return {
          ...curso,
          horas_asignadas: Math.max(0, minutosTotales / 60),
          confirmado: asignaciones.length > 0,
        };
      })
    );

    return NextResponse.json(progreso);
  } catch (error) {
    console.error('Error en mis-cursos:', error);
    return NextResponse.json(
      { error: `Error al obtener progreso: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}
