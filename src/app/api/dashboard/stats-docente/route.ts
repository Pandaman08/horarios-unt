import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { REGIMEN_DEDICACION, TIPO_CONTRATO } from '@/lib/constants/regimenHoras';
import { type RegimenDedicacion, type TipoContrato } from '@/lib/constants/regimenHoras';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Permitir acceso a operadores y admin también (para vista de estadísticas)
    const esDocente = session.user.rol === 'docente';
    const esAdmin = ['administrador_sistema', 'operador_horarios'].includes(session.user.rol);

    if (!esDocente && !esAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let id_docente = session.user.id_docente ? Number(session.user.id_docente) : null;
    
    if (!id_docente) {
      // Intentar buscar por id_usuario
      const docenteDB = await prisma.docente.findFirst({
        where: { id_usuario: Number(session.user.id_usuario) },
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
    const [docente, periodo, declaracionActiva] = await Promise.all([
      prisma.docente.findUnique({
        where: { id_docente },
        select: {
          id_docente: true,
          nombres: true,
          apellidos: true,
          condicion: true,
          categoriaDocente: true,
          regimenDedicacion: true,
          tipoContrato: true,
          horas_maximas_semanales: true,
          departamentoId: true,
          facultadId: true,
        },
      }),
      prisma.periodoAcademico.findUnique({
        where: { id_periodo },
        select: { nombre: true, codigo: true, activo: true },
      }),
      // Buscar declaración activa (cualquier estado excepto RECHAZADO)
      prisma.declaracionHoraria.findFirst({
        where: {
          id_docente,
          id_periodo,
          estado: {
            not: 'RECHAZADO'
          }
        },
        select: { id_declaracion: true, estado: true }
      })
    ]);

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
    }

    // Calcular horas máximas según régimen
    let horasMaximas = 40; // valor por defecto
    if (docente.regimenDedicacion) {
      const regimenInfo = REGIMEN_DEDICACION[docente.regimenDedicacion as RegimenDedicacion];
      if (regimenInfo) {
        horasMaximas = regimenInfo.totalHoras;
      }
    } else if (docente.tipoContrato) {
      const contratoInfo = TIPO_CONTRATO[docente.tipoContrato as TipoContrato];
      if (contratoInfo) {
        horasMaximas = contratoInfo.totalHoras;
      }
    } else if (docente.horas_maximas_semanales && docente.horas_maximas_semanales > 0) {
      horasMaximas = docente.horas_maximas_semanales;
    }

    // Calcular horas lectivas (horario asignado) - usando HorarioAsignado para horarios confirmados
    const asignacionesLectivas = await prisma.horarioAsignado.findMany({
      where: { id_docente, id_periodo },
      include: { curso: true }
    });

    // Calcular horas totales a partir de los bloques de horario
    let horasLectivasAsignadas = 0;
    for (const asig of asignacionesLectivas) {
      if (asig.hora_inicio && asig.hora_fin) {
        const [hInicio, mInicio] = asig.hora_inicio.split(':').map(Number);
        const [hFin, mFin] = asig.hora_fin.split(':').map(Number);
        const minutos = (hFin * 60 + mFin) - (hInicio * 60 + mInicio);
        horasLectivasAsignadas += minutos / 60;
      }
    }

    // Obtener cursos distintos asignados
    const cursosAsignadosIds = new Set(asignacionesLectivas.map((a: { id_curso: number }) => a.id_curso));
    const cantidadCursos = cursosAsignadosIds.size;

    // Calcular horas no lectivas declaradas (desde CargaNoLectiva)
    const declaracionesNoLectivas = await prisma.cargaNoLectiva.findMany({
      where: { 
        declaracion: {
          id_docente: id_docente,
          id_periodo: id_periodo
        }
      },
      select: { horas_semanales: true }
    });

    const horasNoLectivas = declaracionesNoLectivas.reduce((acc: number, curr: { horas_semanales: number }) => acc + curr.horas_semanales, 0);

    // Verificar si tiene disponibilidad registrada
    const disponibilidad = await prisma.disponibilidadDocente.count({
      where: { id_docente, id_periodo }
    });

    const horasTotales = horasLectivasAsignadas + horasNoLectivas;

    // Mapear categoría y condición a texto amigable
    const mapCategoria = (cat: string | null) => {
      if (!cat) return '—';
      const map: Record<string, string> = {
        'PRINCIPAL': 'Principal',
        'ASOCIADO': 'Asociado',
        'AUXILIAR': 'Auxiliar'
      };
      return map[cat] || cat;
    };

    const mapCondicion = (cond: string | null) => {
      if (!cond) return '—';
      const map: Record<string, string> = {
        'ORDINARIO': 'Ordinario (Nombrado)',
        'CONTRATADO': 'Contratado',
        'EXTRAORDINARIO': 'Extraordinario'
      };
      return map[cond] || cond;
    };

    const mapRegimen = (reg: string | null) => {
      if (!reg) return '—';
      const map: Record<string, string> = {
        'DE': 'Dedicación Exclusiva',
        'TC': 'Tiempo Completo',
        'TP1': 'Tiempo Parcial 1 (20h)',
        'TP2': 'Tiempo Parcial 2 (10h)',
        'TP3': 'Tiempo Parcial 3 (8h)'
      };
      return map[reg] || reg;
    };
    const periodoNombre = periodo?.codigo || periodo?.nombre || '—';

    return NextResponse.json({
      docente: {
        id: docente.id_docente,
        nombre: `${docente.nombres} ${docente.apellidos}`,
        condicion: mapCondicion(docente.condicion),
        categoria: mapCategoria(docente.categoriaDocente),
        regimen: mapRegimen(docente.regimenDedicacion),
        horasMaximas: horasMaximas,
        departamentoId: docente.departamentoId,
        facultadId: docente.facultadId,
        tieneDeclaracion: !!declaracionActiva,
        estadoDeclaracion: declaracionActiva?.estado || null,
      },
      periodo: periodoNombre,
      kpis: {
        horasLectivas: Math.round(horasLectivasAsignadas * 100) / 100,
        horasNoLectivas: horasNoLectivas,
        horasTotales: Math.round(horasTotales * 100) / 100,
        cantidadCursos: cantidadCursos,
        horasMaximas: horasMaximas,
      },
      alertas: {
        sinDisponibilidad: disponibilidad === 0,
        declaracionesPendientes: declaracionActiva?.estado === 'BORRADOR' || declaracionActiva?.estado === 'ENVIADO',
        faltaCargaLectiva: cantidadCursos === 0,
        incompleta: horasTotales < horasMaximas
      }
    });
  } catch (error) {
    console.error('Error en stats-docente:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas del docente' }, { status: 500 });
  }
}