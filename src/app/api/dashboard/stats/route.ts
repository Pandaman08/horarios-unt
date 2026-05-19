import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

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

    // 1. KPIs Generales
    const [totalDocentes, totalAsignacionesHoy, totalConflictos] = await Promise.all([
      prisma.docente.count({ where: { activo: true } }),
      prisma.horarioAsignado.count({
        where: {
          id_periodo: id_periodo,
          // Usamos la fecha de creación si existiera, o simplemente el conteo total por ahora
          // En una implementación real filtraríamos por fecha_creacion
        }
      }),
      prisma.conflictoHorario.count({
        where: { id_periodo: id_periodo, resuelto: false }
      })
    ]);

    // 2. Carga por Categoría Real (Suma de horas asignadas)
    const cargaPorCategoria = await prisma.horarioAsignado.findMany({
      where: { id_periodo: id_periodo },
      include: {
        docente: {
          select: { categoria: true }
        }
      }
    });

    const distribucionCarga = cargaPorCategoria.reduce((acc: any, curr) => {
      const cat = curr.docente?.categoria || 'Sin Categoría';
      if (!acc[cat]) acc[cat] = { name: cat, value: 0 };
      acc[cat].value += 1; // Cada registro es una hora/bloque
      return acc;
    }, {});

    const avanceCategoria = Object.values(distribucionCarga);

    // 3. Ocupación de Ambientes (Top 10)
    const ocupacionAmbientes = await prisma.horarioAsignado.groupBy({
      by: ['id_ambiente'],
      _count: { id_asignacion: true },
      where: { id_periodo: id_periodo },
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
      where: { id_periodo: id_periodo },
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

    // 5. Conflictos Detallados
    const listaConflictos = await prisma.conflictoHorario.findMany({
      where: { 
        id_periodo: id_periodo, 
        resuelto: false 
      },
      take: 5,
      orderBy: { fecha_deteccion: 'desc' }
    });

    // 6. Actividad Reciente Real (Últimas asignaciones)
    const actividadReciente = await prisma.horarioAsignado.findMany({
      where: { id_periodo: id_periodo },
      take: 5,
      orderBy: { id_asignacion: 'desc' },
      include: {
        docente: { select: { nombres: true, apellidos: true } },
        ambiente: { select: { nombre: true } }
      }
    });

    const actividadesData = actividadReciente.map(act => ({
      id: act.id_asignacion,
      mensaje: `${act.docente?.nombres} ${act.docente?.apellidos.split(' ')[0]} asignó horario en ${act.ambiente?.nombre}`,
      fecha: "Reciente",
      tipo: 'success'
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
      cargaDocente: cargaData,
      listaConflictos,
      actividadesRecientes: actividadesData
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
