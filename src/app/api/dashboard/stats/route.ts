import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { formatVentanaCategoria } from '@/lib/dashboard-labels';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo_str = searchParams.get('id_periodo');
    const id_periodo = id_periodo_str ? Number.parseInt(id_periodo_str, 10) : Number.NaN;

    if (Number.isNaN(id_periodo)) {
      return NextResponse.json({ error: 'Falta id_periodo o es inválido' }, { status: 400 });
    }

    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo },
      select: { nombre: true, codigo: true },
    });

    const ventanaActiva = await prisma.ventanaAtencion.findFirst({
      where: {
        id_periodo,
        activo: true,
        fecha: { gte: inicioHoy, lte: finHoy },
        completado: false,
      },
      orderBy: { orden_prioridad: 'asc' },
    });

    // ================== NUEVA LOGICA ==================
    
    // 1. Obtener docentes que tienen grupos en el período actual
    const gruposEnPeriodo = await prisma.grupo.findMany({
      where: { id_periodo },
      include: { curso: { include: { docente_cursos: true } } }
    });

    const docentesIdsConGrupos = new Set<number>();
    gruposEnPeriodo.forEach(g => {
      g.curso.docente_cursos.forEach(dc => {
        docentesIdsConGrupos.add(dc.id_docente);
      });
    });

    const totalDocentesEnPeriodo = docentesIdsConGrupos.size;

    // 2. Obtener docentes que ya tienen horarios en el período
    const docentesConHorarios = await prisma.horarioAsignado.groupBy({
      by: ['id_docente'],
      where: { id_periodo },
    });

    const docentesAtendidos = docentesConHorarios.length;

    // ================== FIN NUEVA LOGICA ==================

    const totalAsignacionesHoy = await prisma.horarioAsignado.count({ where: { id_periodo } });
    const totalConflictos = await prisma.conflictoHorario.count({
      where: { id_periodo, resuelto: false },
    });

    const docentesPorGrupo = await prisma.docente.groupBy({
      by: ['modalidad', 'categoria'],
      where: { activo: true, id_docente: { in: Array.from(docentesIdsConGrupos) } },
      _count: { id_docente: true },
    });

    const atendidosPorGrupo = await prisma.horarioAsignado.findMany({
      where: { id_periodo },
      select: {
        id_docente: true,
        docente: { select: { modalidad: true, categoria: true } },
      },
    });

    const atendidosMap = atendidosPorGrupo.reduce((acc: Record<string, Set<number>>, h: any) => {
      const key = `${h.docente?.modalidad}|${h.docente?.categoria}`;
      if (!acc[key]) acc[key] = new Set();
      acc[key].add(h.id_docente);
      return acc;
    }, {});

    const avanceCategoria = docentesPorGrupo.map((g: any) => {
      const key = `${g.modalidad}|${g.categoria}`;
      const atendidos = atendidosMap[key]?.size ?? 0;
      const total = g._count.id_docente;
      const percent = total > 0 ? Math.round((atendidos / total) * 100) : 0;
      return {
        name: formatVentanaCategoria(g.modalidad, g.categoria),
        value: atendidos,
        total,
        percent,
      };
    }).sort((a: any, b: any) => b.percent - a.percent);

    const ocupacionRaw = await prisma.horarioAsignado.groupBy({
      by: ['id_ambiente'],
      _count: { id_asignacion: true },
      where: { id_periodo },
      orderBy: { _count: { id_asignacion: 'desc' } },
    });

    const ambientesIds = ocupacionRaw.map((a: any) => a.id_ambiente);
    const ambientesInfo = await prisma.ambiente.findMany({
      where: { id_ambiente: { in: ambientesIds } },
      select: { id_ambiente: true, nombre: true, codigo: true, tipo: true, capacidad: true },
    });

    const buildOcupacion = (tipos: string[], maxItems = 4) => {
      const items = ocupacionRaw
        .map((oa: any) => {
          const amb = ambientesInfo.find((ai: any) => ai.id_ambiente === oa.id_ambiente);
          if (!amb || !tipos.includes(amb.tipo)) return null;
          const porcentaje = Math.min(
            100,
            Math.round((oa._count.id_asignacion / Math.max(amb.capacidad, 1)) * 100)
          );
          return {
            nombre: amb.codigo,
            cantidad: oa._count.id_asignacion,
            porcentaje,
          };
        })
        .filter(Boolean) as { nombre: string; cantidad: number; porcentaje: number }[];

      return items.slice(0, maxItems);
    };

    const ocupacionTeoria = buildOcupacion(['aula']);
    const ocupacionLaboratorios = buildOcupacion(['laboratorio']);

    const mapaCalorRaw = await prisma.horarioAsignado.groupBy({
      by: ['dia_semana', 'hora_inicio'],
      _count: { id_asignacion: true },
      where: { id_periodo, dia_semana: { gte: 0, lte: 4 } },
    });

    const mapaCalor = mapaCalorRaw.map((m: any) => ({
      dia: m.dia_semana,
      hora: m.hora_inicio,
      valor: m._count.id_asignacion,
    }));

    const listaConflictos = await prisma.conflictoHorario.findMany({
      where: { id_periodo, resuelto: false },
      take: 5,
      orderBy: { fecha_deteccion: 'desc' },
    });

    const porcentajeAvance =
      totalDocentesEnPeriodo > 0 ? Math.round((docentesAtendidos / totalDocentesEnPeriodo) * 100) : 0;

    const ventanaLabel = ventanaActiva
      ? formatVentanaCategoria(ventanaActiva.modalidad, ventanaActiva.categoria)
      : 'Sin ventana activa';

    return NextResponse.json({
      periodo: periodo?.codigo || periodo?.nombre || '—',
      ventanaActiva: ventanaActiva
        ? {
            nombre: ventanaLabel,
            hora_fin: ventanaActiva.hora_fin,
            hora_inicio: ventanaActiva.hora_inicio,
            activa: true,
            porcentajeAvance: ventanaActiva.cantidad_docentes > 0
              ? Math.round((ventanaActiva.cantidad_atendidos / ventanaActiva.cantidad_docentes) * 100)
              : porcentajeAvance,
          }
        : { nombre: 'Sin ventana activa', hora_fin: null, activa: false, porcentajeAvance },
      kpis: {
        totalDocentes: totalDocentesEnPeriodo, // NUEVO: solo docentes con grupos en el período
        docentesAtendidos,
        asignacionesRealizadas: totalAsignacionesHoy,
        conflictosPendientes: totalConflictos,
        porcentajeAvance,
      },
      avanceCategoria,
      ocupacionTeoria,
      ocupacionLaboratorios,
      mapaCalor,
      listaConflictos,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
