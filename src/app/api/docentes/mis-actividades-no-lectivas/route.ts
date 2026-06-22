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

    const declaracion = await prisma.declaracionHoraria.findUnique({
      where: {
        id_docente_id_periodo: {
          id_docente: docenteId,
          id_periodo: periodoId,
        },
      },
      include: {
        cargas_no_lectivas: {
          include: {
            horarios: true,
          },
        },
      },
    });

    const actividades = declaracion?.cargas_no_lectivas || [];
    const progreso = await Promise.all(
      actividades.map(async (actividad) => {
        let minutosTotales = 0;
        actividad.horarios.forEach((h) => {
          minutosTotales += calcularMinutos(h.horaInicio, h.horaFin);
        });

        return {
          id_carga_no_lectiva: actividad.id_carga_no_lectiva,
          tipo: actividad.tipo,
          descripcion: actividad.descripcion,
          horas_semanales: actividad.horas_semanales,
          horas_asignadas: Math.max(0, minutosTotales / 60),
        };
      })
    );

    return NextResponse.json(progreso);
  } catch (error) {
    console.error('Error en mis-actividades-no-lectivas:', error);
    return NextResponse.json(
      { error: `Error al obtener actividades: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}
