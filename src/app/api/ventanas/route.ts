import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ROLES_VENTANAS = ['administrador_sistema', 'operador_horarios'];

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m + minutes;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function parseFechaLocal(fecha?: string | Date | null) {
  if (!fecha) return new Date();
  if (fecha instanceof Date) return new Date(fecha);

  const [year, month, day] = fecha.split('-').map(Number);
  // Construir como medianoche en Peru (UTC-5)
  // Así al leer con timeZone: 'America/Lima' se obtiene la fecha correcta
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
}

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
    const flujo = searchParams.get('flujo'); // para identificar si usamos el nuevo flujo

    if (stats === 'true') {
      const idPeriodoNum = id_periodo ? parseInt(id_periodo) : undefined;
      const wherePeriodo = idPeriodoNum
        ? { id_periodo: idPeriodoNum }
        : {};

      // Nuevas estadísticas para el flujo actualizado
      if (flujo === 'nuevo') {
        const [docentesConCursos, ventanasActivas] = await Promise.all([
          prisma.docente.count({
            where: {
              activo: true,
              declaraciones_horarias: {
                some: {
                  id_periodo: idPeriodoNum,
                  estado: 'BORRADOR', // o el estado que indique "tiene cursos asignados"
                  cargas_lectivas: {
                    some: {} // al menos una carga lectiva
                  }
                }
              }
            }
          }),
          idPeriodoNum
            ? prisma.ventanaAtencion.count({
                where: { id_periodo: idPeriodoNum, activo: true }
              })
            : Promise.resolve(0)
        ]);

        return NextResponse.json({
          docentes_con_cursos: docentesConCursos,
          ventanas_activas: ventanasActivas
        });
      }

      // Mantener estadísticas antiguas para compatibilidad (si no se envía flujo=nuevo)
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

    // Obtener docentes con cursos asignados (nuevo flujo)
    // Si se envía flujo=nuevo, usamos la nueva lógica
    const usarNuevoFlujo = flujo === 'nuevo';

    let docentes = [];
    if (usarNuevoFlujo) {
      // Consulta directa para obtener docentes con cargas lectivas en el período
      docentes = await prisma.docente.findMany({
        where: {
          activo: true,
          declaraciones_horarias: {
            some: {
              id_periodo: idPeriodoNum,
              estado: 'BORRADOR',
              cargas_lectivas: {
                some: {}
              }
            }
          }
        },
        include: {
          usuario: true,
          departamento: true,
          declaraciones_horarias: {
            where: {
              id_periodo: idPeriodoNum,
              estado: 'BORRADOR'
            },
            include: {
              cargas_lectivas: true
            }
          }
        },
        orderBy: [
          { categoriaDocente: 'asc' }, // primero principales, luego asociados, etc.
          { fecha_ingreso: 'asc' }
        ]
      });
    } else {
      // Mantener lógica antigua para compatibilidad
      // Usar el gestor antiguo (si existe, sino se puede implementar aquí)
      // Por ahora, si no es nuevo flujo, devolvemos error o usamos la lógica antigua
      // Para no romper, usamos el gestor antiguo (asumo que existe)
      const { GestorVentanasAtencion } = await import('@/services/ventanas/GestorVentanasAtencion');
      docentes = await GestorVentanasAtencion.obtenerDocentesAprobadosOrdenados(idPeriodoNum);
    }

    if (docentes.length === 0) {
      const mensaje = usarNuevoFlujo
        ? 'No hay docentes con cursos asignados para este período'
        : 'No hay docentes con carga horaria aprobada para este período';
      return NextResponse.json(
        { error: mensaje },
        { status: 400 }
      );
    }

    // Obtener ventanas existentes
    const ventanasExistentes = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: idPeriodoNum, activo: true },
      orderBy: { orden_prioridad: 'asc' }
    });

    // Obtener las ventanas con los docentes correspondientes
    const ventanasConDocentes = ventanasExistentes.map(
      (ventana: { id: number; id_periodo: number; activo: boolean; orden_prioridad: number; [key: string]: unknown }, index: number) => ({
        ...ventana,
        docente: docentes[index] || null
      })
    );

    return NextResponse.json({
      ventanas: ventanasConDocentes,
      docentes_con_cursos: docentes.length,
      docentes_sin_ventana: Math.max(0, docentes.length - ventanasExistentes.length)
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
      modo = 'incremental',
      flujo = 'antiguo' // por defecto antiguo para no romper
    } = data;

    if (!id_periodo) {
      return NextResponse.json({ error: 'id_periodo es requerido' }, { status: 400 });
    }

    const idPeriodoNum = parseInt(id_periodo);
    const usarNuevoFlujo = flujo === 'nuevo';

    let docentes = [];
    if (usarNuevoFlujo) {
      // Obtener docentes con cursos asignados (nuevo flujo)
      docentes = await prisma.docente.findMany({
        where: {
          activo: true,
          declaraciones_horarias: {
            some: {
              id_periodo: idPeriodoNum,
              estado: 'BORRADOR',
              cargas_lectivas: {
                some: {}
              }
            }
          }
        },
        include: {
          usuario: true,
          departamento: true,
          declaraciones_horarias: {
            where: {
              id_periodo: idPeriodoNum,
              estado: 'BORRADOR'
            },
            include: {
              cargas_lectivas: true
            }
          }
        },
        orderBy: [
          { categoriaDocente: 'asc' },
          { fecha_ingreso: 'asc' }
        ]
      });
    } else {
      // Lógica antigua
      const { GestorVentanasAtencion } = await import('@/services/ventanas/GestorVentanasAtencion');
      docentes = await GestorVentanasAtencion.obtenerDocentesAprobadosOrdenados(idPeriodoNum);
    }

    console.log('📋 Docentes encontrados:', docentes.length);

    if (docentes.length === 0) {
      const mensaje = usarNuevoFlujo
        ? 'No hay docentes con cursos asignados para este período'
        : 'No hay docentes con carga horaria aprobada para este período';
      return NextResponse.json(
        { error: mensaje },
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

    console.log('📋 Ventanas existentes:', ventanasExistentes.length);

    const ventanasActivasCount = modo === 'completo' ? 0 : ventanasExistentes.length;
    const docentesPendientes = docentes.slice(ventanasActivasCount);

    if (docentesPendientes.length === 0) {
      return NextResponse.json({
        message: 'Todos los docentes ya tienen ventana asignada',
        ventanas: ventanasExistentes,
        ventanas_creadas: 0,
        docentes_procesados: docentes.length
      });
    }

    let fechaInicio = parseFechaLocal(fecha_inicio);
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
      const horaFin = addMinutesToTime(horaActual, intervalo);

      const ventana = await prisma.ventanaAtencion.create({
        data: {
          id_periodo: idPeriodoNum,
          fecha: fechaInicio,
          hora_inicio: horaActual,
          hora_fin: horaFin,
          modalidad: docente.condicion || 'ORDINARIO',
          categoria: docente.categoriaDocente || 'AUXILIAR',
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
        fechaInicio = new Date(fechaInicio.getTime() + 86400000);
        horaActual = hora_inicio_jornada || '08:00';
      }
    }
    console.log('📋 Docentes pendientes:', docentesPendientes.length);
    return NextResponse.json({
      message: `${nuevasVentanas.length} ventana(s) creada(s) exitosamente`,
      ventanas: nuevasVentanas,
      ventanas_creadas: nuevasVentanas.length,
      docentes_procesados: docentes.length
    });

    

  } catch (error: any) {
    console.error('Error al crear ventanas:', error);
    return NextResponse.json(
      { error: 'Error al crear ventanas', message: error.message },
      { status: 500 }
    );
  }
}