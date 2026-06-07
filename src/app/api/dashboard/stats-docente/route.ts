import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.rol !== 'docente') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const id_docente = session.user.id_docente;
    if (!id_docente) {
      return NextResponse.json({ error: 'ID de docente no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id_periodo_str = searchParams.get('id_periodo');
    const id_periodo = id_periodo_str ? Number.parseInt(id_periodo_str, 10) : Number.NaN;

    if (Number.isNaN(id_periodo)) {
      return NextResponse.json({ error: 'Falta id_periodo o es inválido' }, { status: 400 });
    }

    // Obtener información del docente y el periodo
    const [docente, periodo] = await Promise.all([
      prisma.docente.findUnique({
        where: { id_docente },
        select: { modalidad: true, categoria: true, horas_maximas_semanales: true },
      }),
      prisma.periodoAcademico.findUnique({
        where: { id_periodo },
        select: { nombre: true, codigo: true },
      })
    ]);

    // Calcular horas lectivas (horario asignado)
    const asignacionesLectivas = await prisma.horarioAsignado.findMany({
      where: { id_docente, id_periodo },
      include: { curso: true }
    });

    // Sumar créditos o usar algún cálculo para horas lectivas (asumiremos 1 asignacion = 2 horas o segun el curso)
    // Para simplificar, contaremos las asignaciones. Usualmente 1 asignacion = 1 hora o 2 horas. 
    // Mirando como el sistema lo calcula en otros lados... usaremos la cantidad.
    const horasLectivasAsignadas = asignacionesLectivas.length * 2; // Aproximación

    // Obtener cursos distintos asignados
    const cursosAsignadosIds = new Set(asignacionesLectivas.map(a => a.id_curso));
    const cantidadCursos = cursosAsignadosIds.size;

    // Calcular horas no lectivas declaradas
    const declaracionesNoLectivas = await prisma.cargaNoLectiva.findMany({
      where: { id_docente, id_periodo },
      select: { horas_semanales: true, estado: true }
    });

    const horasNoLectivas = declaracionesNoLectivas.reduce((acc, curr) => acc + curr.horas_semanales, 0);
    const declaracionesPendientes = declaracionesNoLectivas.filter(d => d.estado !== 'aprobado').length;

    // Verificar si tiene disponibilidad registrada
    const disponibilidad = await prisma.disponibilidadDocente.count({
      where: { id_docente, id_periodo }
    });

    const horasTotales = horasLectivasAsignadas + horasNoLectivas;

    return NextResponse.json({
      periodo: periodo?.codigo || periodo?.nombre || '—',
      kpis: {
        horasLectivas: horasLectivasAsignadas,
        horasNoLectivas: horasNoLectivas,
        horasTotales: horasTotales,
        cantidadCursos: cantidadCursos,
        minHorasLectivas: 0, // No existe en el modelo, valor por defecto
        maxHorasLectivas: docente?.horas_maximas_semanales || 40,
      },
      alertas: {
        sinDisponibilidad: disponibilidad === 0,
        declaracionesPendientes: declaracionesPendientes > 0,
        faltaCargaLectiva: false // Desactivado temporalmente ya que no existe min_horas_lectivas
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas del docente' }, { status: 500 });
  }
}
