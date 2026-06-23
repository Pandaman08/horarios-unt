import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function getFechaLocalPeru(date: Date) {
  return date.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
}

function getHoraLocalPeru(date: Date) {
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'America/Lima',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getMinutosDesdeHora(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(request: Request) {
  console.log('📋 CHECK-INTERVAL - Iniciando verificación...');
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');

    // Obtener el período activo (si no se envía, usar el que está activo)
    let periodoId: number;
    if (id_periodo) {
      periodoId = Number.parseInt(id_periodo);
    } else {
      const periodoActivo = await prisma.periodoAcademico.findFirst({
        where: { activo: true },
        orderBy: { id_periodo: 'desc' }
      });
      if (!periodoActivo) {
        return NextResponse.json({ error: 'No hay período activo' }, { status: 404 });
      }
      periodoId = periodoActivo.id_periodo;
    }

    console.log('📋 CHECK-INTERVAL - Período ID:', periodoId);

    // 1. Obtener todos los docentes con cursos asignados en el período (estado BORRADOR)
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        declaraciones_horarias: {
          some: {
            id_periodo: periodoId,
            estado: 'BORRADOR',
            cargas_lectivas: {
              some: {}
            }
          }
        }
      },
      include: {
        usuario: true,
        declaraciones_horarias: {
          where: {
            id_periodo: periodoId,
            estado: 'BORRADOR'
          },
          include: {
            cargas_lectivas: true
          }
        }
      },
      orderBy: [
        { categoriaDocente: 'asc' }, // PRINCIPAL, ASOCIADO, AUXILIAR
        { fecha_ingreso: 'asc' }     // más antiguo primero
      ]
    });

    console.log('📋 CHECK-INTERVAL - Docentes con cursos asignados:', docentes.map((d: { id_docente: number; nombres: string; apellidos: string; categoriaDocente: string | null; fecha_ingreso: Date | null }) => ({
      id: d.id_docente,
      nombre: `${d.nombres} ${d.apellidos}`,
      categoria: d.categoriaDocente,
      ingreso: d.fecha_ingreso
    })));

    // 2. Obtener la ventana activa más próxima (la primera no completada)
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: {
        id_periodo: periodoId,
        activo: true,
        completado: false
      },
      orderBy: { orden_prioridad: 'asc' }
    });

    console.log('📋 CHECK-INTERVAL - Ventanas activas:', ventanas.map((v: { id_ventana: number; orden_prioridad: number; hora_inicio: string; hora_fin: string }) => ({
      id: v.id_ventana,
      orden: v.orden_prioridad,
      inicio: v.hora_inicio,
      fin: v.hora_fin
    })));

    if (ventanas.length === 0) {
      return NextResponse.json({
        soloLectura: true,
        mensaje: 'No hay ventanas activas en este período.',
        hayVentanas: false
      });
    }

    // Tomar la primera ventana no completada (la de mayor prioridad)
    const ventanaActual = ventanas[0];

    // 3. Determinar qué docente corresponde a esta ventana (por orden de prioridad)
    const indiceDocente = ventanaActual.orden_prioridad - 1;
    const docenteConTurno = docentes[indiceDocente];

    if (!docenteConTurno) {
      return NextResponse.json({
        soloLectura: true,
        mensaje: 'No hay docente asignado para esta ventana.',
        hayVentanas: true
      });
    }

    // 4. Obtener el docente logueado
    let docenteLogueado = null;

    // Primero intentar obtener por id_docente desde la sesión
    if (session.user.id_docente) {
      docenteLogueado = await prisma.docente.findUnique({
        where: { id_docente: Number(session.user.id_docente) }
      });
    }

    // Si no se encontró, buscar por id_usuario (fallback)
    if (!docenteLogueado && session.user.id_usuario) {
      docenteLogueado = await prisma.docente.findFirst({
        where: { id_usuario: Number(session.user.id_usuario) }
      });
    }

    console.log('📋 CHECK-INTERVAL - docenteLogueado:', docenteLogueado?.id_docente, docenteLogueado?.nombres);

    if (!docenteLogueado) {
      return NextResponse.json({
        soloLectura: false,
        mensaje: 'Acceso para administrador/operador',
        hayVentanas: true,
        esAdmin: true
      });
    }

    // 5. Verificar si el docente logueado es el que tiene el turno
    const esMiTurno = docenteLogueado.id_docente === docenteConTurno.id_docente;

    // 6. Verificar si la hora actual está dentro del intervalo de la ventana en hora local de Lima
    const ahora = new Date();
    const hoyLima = getFechaLocalPeru(ahora);
    const fechaVentana = new Date(ventanaActual.fecha).toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

    let dentroDeHorario = false;
    let segundosRestantes = null;
    if (fechaVentana === hoyLima) {
      const horaActualLima = getHoraLocalPeru(ahora);
      const inicioMin = getMinutosDesdeHora(ventanaActual.hora_inicio);
      const finMin = getMinutosDesdeHora(ventanaActual.hora_fin);
      const ahoraMin = getMinutosDesdeHora(horaActualLima);
      dentroDeHorario = ahoraMin >= inicioMin && ahoraMin < finMin;

      if (dentroDeHorario) {
        const minutosRestantes = Math.max(0, finMin - ahoraMin);
        const segundosEnElMinuto = ahora.getSeconds();
        segundosRestantes = Math.max(0, minutosRestantes * 60 - segundosEnElMinuto);
      }
    }

    // 7. Construir respuesta
    if (!esMiTurno) {
      const siguienteVentana = ventanas[1] || null;
      let mensaje = `Actualmente no se encuentra en su ventana de atención asignada.`;
      if (siguienteVentana) {
        mensaje += ` Su turno está programado para el día ${siguienteVentana.fecha.toLocaleDateString('es-PE')} a las ${siguienteVentana.hora_inicio}.`;
      } else {
        mensaje += ' No hay más ventanas programadas.';
      }
      return NextResponse.json({
        soloLectura: true,
        mensaje,
        hayVentanas: true,
        esMiTurno: false,
        ventanaActual: {
          docente: `${docenteConTurno.nombres} ${docenteConTurno.apellidos}`,
          horaInicio: ventanaActual.hora_inicio,
          horaFin: ventanaActual.hora_fin,
          fecha: ventanaActual.fecha
        }
      });
    }

    // Es su turno pero no está dentro del horario activo
    if (!dentroDeHorario) {
      const fechaInicioLima = ventanaActual.fecha.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
      const horaActualLima = getHoraLocalPeru(ahora);
      const inicioMin = getMinutosDesdeHora(ventanaActual.hora_inicio);
      const finMin = getMinutosDesdeHora(ventanaActual.hora_fin);
      const ahoraMin = getMinutosDesdeHora(horaActualLima);

      let mensaje = 'Su ventana de atención no está activa en este momento.';
      if (fechaVentana > hoyLima) {
        mensaje = `Su turno está programado para el día ${new Date(ventanaActual.fecha).toLocaleDateString('es-PE')} a las ${ventanaActual.hora_inicio}.`;
      } else if (fechaVentana < hoyLima) {
        mensaje = `Su turno correspondía al día ${new Date(ventanaActual.fecha).toLocaleDateString('es-PE')} a las ${ventanaActual.hora_inicio} y ya finalizó. El sistema está en modo solo lectura.`;
      } else if (ahoraMin < inicioMin) {
        mensaje = 'Su ventana de atención ha comenzado pero aún no está dentro del horario. Por favor, espere hasta la hora de inicio.';
      } else {
        mensaje = `Su ventana de atención terminó a las ${ventanaActual.hora_fin}. El sistema está en modo solo lectura.`;
      }

      return NextResponse.json({
        soloLectura: true,
        mensaje,
        hayVentanas: true,
        esMiTurno: true,
        dentroDeHorario: false,
        ventanaActual: {
          horaInicio: ventanaActual.hora_inicio,
          horaFin: ventanaActual.hora_fin,
          fecha: ventanaActual.fecha
        }
      });
    }

    // Turno activo y dentro del horario
    console.log('⏱️  CHECK-INTERVAL - Cálculo de segundosRestantes:', {
      fechaVentana: ventanaActual.fecha.toISOString().split('T')[0],
      horaFin: ventanaActual.hora_fin,
      ahoraLima: getHoraLocalPeru(ahora),
      hoyLima,
      fechaVentanaLima: fechaVentana,
      segundosRestantes
    });

    return NextResponse.json({
      soloLectura: false,
      mensaje: `Ventana activa. Tiempo restante: ${Math.floor(Math.max(0, segundosRestantes) / 60)} minutos.`,
      hayVentanas: true,
      esMiTurno: true,
      dentroDeHorario: true,
      segundos_restantes: Math.max(0, segundosRestantes),
      ventanaActual: {
        horaInicio: ventanaActual.hora_inicio,
        horaFin: ventanaActual.hora_fin,
        fecha: ventanaActual.fecha,
        intervaloMinutos: ventanaActual.intervalo_minutos
      }
    });

  } catch (error) {
    console.error('❌ Error en check-interval:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}