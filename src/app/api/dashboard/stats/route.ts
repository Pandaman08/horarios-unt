import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    
    if (!id_periodo) {
      return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });
    }

    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);

    // 1. KPIs Generales
    const [totalDocentes, totalAsignacionesHoy, totalConflictos] = await Promise.all([
      prisma.docente.count({ where: { activo: true } }),
      prisma.horarioAsignado.count({
        where: {
          id_periodo: parseInt(id_periodo),
          // Usamos la fecha de creación si existiera, o simplemente el conteo total por ahora
          // En una implementación real filtraríamos por fecha_creacion
        }
      }),
      prisma.conflictoHorario.count({
        where: { id_periodo: parseInt(id_periodo), resuelto: false }
      })
    ]);

    // 2. Avance por Categoría (Barras)
    const avanceCategoria = await prisma.docente.groupBy({
      by: ['categoria'],
      _count: { id_docente: true },
      where: { activo: true }
    });

    // 3. Ocupación de Ambientes (Top 10)
    const ocupacionAmbientes = await prisma.horarioAsignado.groupBy({
      by: ['id_ambiente'],
      _count: { id_asignacion: true },
      where: { id_periodo: parseInt(id_periodo) },
      orderBy: { _count: { id_asignacion: 'desc' } },
      take: 10
    });

    // Enriquecer datos de ambientes
    const ambientesIds = ocupacionAmbientes.map(a => a.id_ambiente);
    const ambientesInfo = await prisma.ambiente.findMany({
      where: { id_ambiente: { in: ambientesIds } },
      select: { id_ambiente: true, nombre: true }
    });

    const ocupacionData = ocupacionAmbientes.map(oa => ({
      nombre: ambientesInfo.find(ai => ai.id_ambiente === oa.id_ambiente)?.nombre || 'Desconocido',
      cantidad: oa._count.id_asignacion
    }));

    // 4. Distribución de Carga Docente (Top 10)
    const cargaDocente = await prisma.horarioAsignado.groupBy({
      by: ['id_docente'],
      _count: { id_asignacion: true },
      where: { id_periodo: parseInt(id_periodo) },
      orderBy: { _count: { id_asignacion: 'desc' } },
      take: 10
    });

    const docentesIds = cargaDocente.map(cd => cd.id_docente);
    const docentesInfo = await prisma.docente.findMany({
      where: { id_docente: { in: docentesIds } },
      select: { id_docente: true, nombres: true, apellidos: true }
    });

    const cargaData = cargaDocente.map(cd => ({
      nombre: `${docentesInfo.find(di => di.id_docente === cd.id_docente)?.nombres} ${docentesInfo.find(di => di.id_docente === cd.id_docente)?.apellidos.charAt(0)}.`,
      asignaciones: cd._count.id_asignacion
    }));

    return NextResponse.json({
      kpis: {
        totalDocentes,
        asignacionesRealizadas: totalAsignacionesHoy,
        conflictosPendientes: totalConflictos,
        porcentajeAvance: totalDocentes > 0 ? Math.round((totalAsignacionesHoy / (totalDocentes * 2)) * 100) : 0 // Estimado
      },
      avanceCategoria,
      ocupacionAmbientes: ocupacionData,
      cargaDocente: cargaData
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
