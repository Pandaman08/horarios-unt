import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import { formatVentanaCategoria } from '@/lib/dashboard-labels';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo_str = searchParams.get('id_periodo');
    const id_periodo = id_periodo_str ? parseInt(id_periodo_str) : NaN;

    if (isNaN(id_periodo)) {
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

    const [totalDocentes, docentesAtendidos, totalAsignacionesHoy, totalConflictos] = await Promise.all([
      prisma.docente.count({ where: { activo: true } }),
      prisma.horarioAsignado.groupBy({
        by: ['id_docente'],
        where: { id_periodo },
      }).then((r) => r.length),
      prisma.horarioAsignado.count({ where: { id_periodo } }),
      prisma.conflictoHorario.count({
        where: { id_periodo, resuelto: false },
      }),
    ]);

    const docentesPorGrupo = await prisma.docente.groupBy({
      by: ['modalidad', 'categoria'],
      where: { activo: true },
      _count: { id_docente: true },
    });

    const atendidosPorGrupo = await prisma.horarioAsignado.findMany({
      where: { id_periodo },
      select: {
        id_docente: true,
        docente: { select: { modalidad: true, categoria: true } },
      },
    });

    const atendidosMap = atendidosPorGrupo.reduce((acc: Record<string, Set<number>>, h) => {
      const key = `${h.docente?.modalidad}|${h.docente?.categoria}`;
      if (!acc[key]) acc[key] = new Set();
      acc[key].add(h.id_docente);
      return acc;
    }, {} as Record<string, Set<number>>);

    const avanceCategoria = docentesPorGrupo.map((g) => {
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
    }).sort((a, b) => b.percent - a.percent);

    const ocupacionRaw = await prisma.horarioAsignado.groupBy({
      by: ['id_ambiente'],
      _count: { id_asignacion: true },
      where: { id_periodo },
      orderBy: { _count: { id_asignacion: 'desc' } },
    });

    const ambientesIds = ocupacionRaw.map((a) => a.id_ambiente);
    const ambientesInfo = await prisma.ambiente.findMany({
      where: { id_ambiente: { in: ambientesIds } },
      select: { id_ambiente: true, nombre: true, codigo: true, tipo: true, capacidad: true },
    });

    const buildOcupacion = (tipo: string, maxItems = 4) => {
      const items = ocupacionRaw
        .map((oa) => {
          const amb = ambientesInfo.find((ai) => ai.id_ambiente === oa.id_ambiente);
          if (!amb || amb.tipo !== tipo) return null;
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

    const ocupacionTeoria = buildOcupacion('teoria');
    const ocupacionLaboratorios = buildOcupacion('laboratorio');

    const mapaCalorRaw = await prisma.horarioAsignado.groupBy({
      by: ['dia_semana', 'hora_inicio'],
      _count: { id_asignacion: true },
      where: { id_periodo, dia_semana: { gte: 0, lte: 4 } },
    });

    const mapaCalor = mapaCalorRaw.map((m) => ({
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
      totalDocentes > 0 ? Math.round((docentesAtendidos / totalDocentes) * 100) : 0;

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
            porcentajeAvance: ventanaActiva.cantidad_docentes > 0
              ? Math.round((ventanaActiva.cantidad_atendidos / ventanaActiva.cantidad_docentes) * 100)
              : porcentajeAvance,
          }
        : { nombre: ventanaLabel, hora_fin: null, porcentajeAvance },
      kpis: {
        totalDocentes,
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
