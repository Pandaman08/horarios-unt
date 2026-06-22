import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GestorVentanasAtencion } from '@/services/ventanas/GestorVentanasAtencion';

const ROLES_VENTANAS = ['administrador_sistema', 'operador_horarios'];

async function requireRolVentanas() {
  const session = await getServerSession(authOptions);
  if (!session || !ROLES_VENTANAS.includes(session.user.rol)) {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const idPeriodoNum = id_periodo ? parseInt(id_periodo) : undefined;
      const wherePeriodo = idPeriodoNum
        ? { id_periodo: idPeriodoNum }
        : {};

      const [aprobados, enviados, ventanasActivas] = await Promise.all([
        prisma.declaracionHoraria.count({
          where: { ...wherePeriodo, estado: 'APROBADO' }
        }),
        prisma.declaracionHoraria.count({
          where: { ...wherePeriodo, estado: 'ENVIADO' }
        }),
        idPeriodoNum
          ? prisma.ventanaAtencion.count({
              where: { id_periodo: idPeriodoNum, activo: true }
            })
          : Promise.resolve(0)
      ]);

      return NextResponse.json({
        docentes_aprobados: aprobados,
        docentes_pendientes: enviados,
        ventanas_activas: ventanasActivas
      });
    }

    if (!id_periodo) {
      return NextResponse.json(
        { error: 'id_periodo es requerido' },
        { status: 400 }
      );
    }

    const idPeriodoNum = parseInt(id_periodo);
    const docentes = await GestorVentanasAtencion.obtenerDocentesAprobadosOrdenados(idPeriodoNum);

    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: idPeriodoNum, activo: true },
      orderBy: { orden_prioridad: 'asc' }
    });

    const ventanasConDocentes = ventanas.map((ventana, index) => ({
      ...ventana,
      docente: docentes[index] || null
    }));

    return NextResponse.json({
      ventanas: ventanasConDocentes,
      docentes_aprobados: docentes.length,
      docentes_sin_ventana: Math.max(0, docentes.length - ventanas.length)
    });

  } catch (error: any) {
    console.error('Error al obtener ventanas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRolVentanas();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data = await request.json();
    const {
      id_periodo,
      fecha_inicio,
      hora_inicio_jornada,
      hora_fin_jornada,
      intervalo_por_docente,
      modo = 'incremental'
    } = data;

    if (!id_periodo) {
      return NextResponse.json({ error: 'id_periodo es requerido' }, { status: 400 });
    }

    const idPeriodoNum = parseInt(id_periodo);
    const docentes = await GestorVentanasAtencion.obtenerDocentesAprobadosOrdenados(idPeriodoNum);

    if (docentes.length === 0) {
      return NextResponse.json(
        { error: 'No hay docentes con carga horaria aprobada para este período' },
        { status: 400 }
      );
    }

    const ventanasExistentes = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: idPeriodoNum, activo: true },
      orderBy: { orden_prioridad: 'asc' }
    });

    if (modo === 'completo') {
      await prisma.ventanaAtencion.updateMany({
        where: { id_periodo: idPeriodoNum },
        data: { activo: false }
      });
    }

    const ventanasActivasCount = modo === 'completo' ? 0 : ventanasExistentes.length;
    const docentesPendientes = docentes.slice(ventanasActivasCount);

    if (docentesPendientes.length === 0) {
      return NextResponse.json({
        message: 'Todos los docentes con carga aprobada ya tienen ventana asignada',
        ventanas: ventanasExistentes,
        ventanas_creadas: 0
      });
    }

    let fechaInicio = new Date(fecha_inicio || new Date());
    let horaActual = hora_inicio_jornada || '08:00';
    let ordenPrioridad = ventanasActivasCount + 1;

    if (ventanasActivasCount > 0) {
      const ultimaVentana = ventanasExistentes[ventanasExistentes.length - 1];
      fechaInicio = new Date(ultimaVentana.fecha);
      horaActual = ultimaVentana.hora_fin;
      ordenPrioridad = (ultimaVentana.orden_prioridad || ventanasActivasCount) + 1;
    }

    const intervalo = parseInt(intervalo_por_docente || '15');
    const horaFinJornada = hora_fin_jornada || '18:00';
    const nuevasVentanas = [];

    for (const docente of docentesPendientes) {
      const [h, m] = horaActual.split(':').map(Number);
      const fechaHora = new Date(fechaInicio);
      fechaHora.setHours(h, m, 0, 0);
      fechaHora.setMinutes(fechaHora.getMinutes() + intervalo);

      const horaFin = `${String(fechaHora.getHours()).padStart(2, '0')}:${String(fechaHora.getMinutes()).padStart(2, '0')}`;

      const ventana = await prisma.ventanaAtencion.create({
        data: {
          id_periodo: idPeriodoNum,
          fecha: fechaInicio,
          hora_inicio: horaActual,
          hora_fin: horaFin,
          modalidad: docente.condicion,
          categoria: docente.categoriaDocente,
          cantidad_docentes: 1,
          completado: false,
          activo: true,
          orden_prioridad: ordenPrioridad++,
          intervalo_minutos: intervalo
        }
      });

      nuevasVentanas.push({ ...ventana, docente });
      horaActual = horaFin;

      if (horaActual > horaFinJornada) {
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        horaActual = hora_inicio_jornada || '08:00';
      }
    }

    return NextResponse.json({
      message: `${nuevasVentanas.length} ventana(s) creada(s) exitosamente`,
      ventanas: nuevasVentanas,
      ventanas_creadas: nuevasVentanas.length,
      docentes_aprobados: docentes.length
    });

  } catch (error: any) {
    console.error('Error al crear ventanas:', error);
    return NextResponse.json(
      { error: 'Error al crear ventanas', message: error.message },
      { status: 500 }
    );
  }
}
