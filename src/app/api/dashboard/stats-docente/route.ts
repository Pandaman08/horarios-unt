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

    let id_docente = session.user.id_docente ? Number(session.user.id_docente) : null;
    
    if (!id_docente) {
      // Intentar buscar por id_usuario si no está en la sesión
      const docenteDB = await prisma.docente.findFirst({
        where: { id_usuario: String(session.user.id_usuario) },
        select: { id_docente: true }
      });
      
      if (!docenteDB) {
        return NextResponse.json({ error: 'ID de docente no encontrado' }, { status: 400 });
      }
      id_docente = docenteDB.id_docente;
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

    const horasLectivasAsignadas = asignacionesLectivas.length * 2; 

    // Obtener cursos distintos asignados
    const cursosAsignadosIds = new Set(asignacionesLectivas.map(a => a.id_curso));
    const cantidadCursos = cursosAsignadosIds.size;

    // Calcular horas no lectivas declaradas
    const declaracionesNoLectivas = await prisma.cargaNoLectiva.findMany({
      where: { 
        declaracion: {
          id_docente: id_docente,
          id_periodo: id_periodo
        }
      },
      select: { horas_semanales: true }
    });

    const horasNoLectivas = declaracionesNoLectivas.reduce((acc, curr) => acc + curr.horas_semanales, 0);

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
        minHorasLectivas: 0, 
        maxHorasLectivas: docente?.horas_maximas_semanales || 40,
      },
      alertas: {
        sinDisponibilidad: disponibilidad === 0,
        declaracionesPendientes: false,
        faltaCargaLectiva: false 
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas del docente' }, { status: 500 });
  }
}
