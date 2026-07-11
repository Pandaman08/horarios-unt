import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

const prioridadCategoria = ['AUXILIAR', 'ASOCIADO', 'PRINCIPAL'];
const prioridadCondicion = ['ORDINARIO', 'CONTRATADO', 'EXTRAORDINARIO'];

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

// Función de ordenamiento EXACTA igual a la de GestorVentanasAtencion
function ordenarDocentes(docentes: any[]) {
  return [...docentes].sort((a, b) => {
    const condA = a.condicion || 'ORDINARIO';
    const condB = b.condicion || 'ORDINARIO';
    const idxA = prioridadCondicion.indexOf(condA);
    const idxB = prioridadCondicion.indexOf(condB);
    if (idxA !== idxB) return idxA - idxB;

    const catA = a.categoriaDocente || 'AUXILIAR';
    const catB = b.categoriaDocente || 'AUXILIAR';
    const idxCatA = prioridadCategoria.indexOf(catA);
    const idxCatB = prioridadCategoria.indexOf(catB);
    if (idxCatA !== idxCatB) return idxCatB - idxCatA;

    if (a.fecha_ingreso && b.fecha_ingreso) {
      return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
    }
    return 0;
  });
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

    if (!docenteLogueado) {
      return NextResponse.json({
        soloLectura: false,
        mensaje: 'Acceso para administrador/operador',
        hayVentanas: true,
        esAdmin: true
      });
    }

    console.log('📋 CHECK-INTERVAL - docenteLogueado:', docenteLogueado.id_docente, docenteLogueado.nombres);

    // PRIMERO: Verificar si el docente ya tiene horarios confirmados o asignados
    // Si tiene horarios, permitir acceso en modo solo lectura para verlos
    const horariosConfirmados = await prisma.horarioAsignado.findMany({
      where: {
        id_docente: docenteLogueado.id_docente,
        estado: {
          in: ["confirmado", "definitivo", "asignado", "publicado"]
        }
      },
      take: 1
    });

    if (horariosConfirmados.length > 0) {
      return NextResponse.json({
        soloLectura: true,
        mensaje: "Viendo horario confirmado",
        hayVentanas: true
      });
    }

    // 1. Obtener todos los docentes con cursos asignados en el período (MISMA LÓGICA QUE VENTANAS)
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
        departamento: true,
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
        { categoriaDocente: 'asc' }, // primero principales, luego asociados, etc.
        { fecha_ingreso: 'asc' }
      ]
    });

    console.log('📋 CHECK-INTERVAL - Docentes con cursos asignados (ordenados):', docentes.map((d: any) => ({
      id: d.id_docente,
      nombre: `${d.nombres} ${d.apellidos}`,
      categoria: d.categoriaDocente,
      ingreso: d.fecha_ingreso
    })));

    // 2. Obtener todas las ventanas
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: {
        id_periodo: periodoId,
        activo: true
      },
      orderBy: { orden_prioridad: 'asc' }
    });

    console.log('📋 CHECK-INTERVAL - Ventanas activas:', ventanas.map((v: any) => ({
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

    // 3. Encontrar la ventana del docente logueado usando el MISMO orden que docentes-ventana
    const docentesOrdenados = ordenarDocentes(docentes);
    const indexDocente = docentesOrdenados.findIndex((d: any) => d.id_docente === docenteLogueado.id_docente);
    const ventanaDocente = indexDocente !== -1 && ventanas.length > indexDocente ? ventanas[indexDocente] : null;

    if (!ventanaDocente) {
      return NextResponse.json({
        soloLectura: true,
        mensaje: 'No tiene turnos programados en este periodo.',
        hayVentanas: true
      });
    }

    console.log('📋 CHECK-INTERVAL - Ventana del docente:', ventanaDocente);

    // 6. Verificar si la hora actual está dentro del intervalo de la ventana en hora local de Lima
    const ahora = new Date();
    const hoyLima = getFechaLocalPeru(ahora);
    const fechaVentana = new Date(ventanaDocente.fecha).toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

    let dentroDeHorario = false;
    let segundosRestantes = null;
    if (fechaVentana === hoyLima) {
      const horaActualLima = getHoraLocalPeru(ahora);
      const inicioMin = getMinutosDesdeHora(ventanaDocente.hora_inicio);
      const finMin = getMinutosDesdeHora(ventanaDocente.hora_fin);
      const ahoraMin = getMinutosDesdeHora(horaActualLima);
      dentroDeHorario = ahoraMin >= inicioMin && ahoraMin < finMin;

      if (dentroDeHorario) {
        const minutosRestantes = Math.max(0, finMin - ahoraMin);
        const segundosEnElMinuto = ahora.getSeconds();
        segundosRestantes = Math.max(0, minutosRestantes * 60 - segundosEnElMinuto);
      }
    }

    // 7. Construir respuesta
    if (!dentroDeHorario) {
      const fechaInicioLima = ventanaDocente.fecha.toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
      const horaActualLima = getHoraLocalPeru(ahora);
      const inicioMin = getMinutosDesdeHora(ventanaDocente.hora_inicio);
      const finMin = getMinutosDesdeHora(ventanaDocente.hora_fin);
      const ahoraMin = getMinutosDesdeHora(horaActualLima);

      let mensaje = 'Su ventana de atención no está activa en este momento.';
      if (fechaVentana > hoyLima) {
        mensaje = `Su turno está programado para el día ${new Date(ventanaDocente.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} a las ${ventanaDocente.hora_inicio}.`;
      } else if (fechaVentana < hoyLima) {
        mensaje = `Su turno correspondió al día ${new Date(ventanaDocente.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} a las ${ventanaDocente.hora_inicio} y ya finalizó. El sistema está en modo solo lectura.`;
      } else if (ahoraMin < inicioMin) {
        mensaje = `Su turno está programado para hoy a las ${ventanaDocente.hora_inicio}. Por favor, espere hasta la hora de inicio.`;
      } else {
        mensaje = `Su ventana de atención finalizó a las ${ventanaDocente.hora_fin}. El sistema está en modo solo lectura.`;
      }

      return NextResponse.json({
        soloLectura: true,
        mensaje,
        hayVentanas: true,
        esMiTurno: true,
        dentroDeHorario: false,
        ventanaActual: {
          horaInicio: ventanaDocente.hora_inicio,
          horaFin: ventanaDocente.hora_fin,
          fecha: ventanaDocente.fecha
        }
      });
    }

    // Turno activo y dentro del horario
    console.log('⏱️  CHECK-INTERVAL - Cálculo de segundosRestantes:', {
      fechaVentana: ventanaDocente.fecha.toISOString().split('T')[0],
      horaFin: ventanaDocente.hora_fin,
      ahoraLima: getHoraLocalPeru(ahora),
      hoyLima,
      fechaVentanaLima: fechaVentana,
      segundosRestantes
    });

    return NextResponse.json({
      soloLectura: false,
      mensaje: `Ventana activa. Tiempo restante: ${Math.floor(Math.max(0, segundosRestantes ?? 0) / 60)} minutos.`,
      hayVentanas: true,
      esMiTurno: true,
      dentroDeHorario: true,
      segundos_restantes: Math.max(0, segundosRestantes ?? 0),
      ventanaActual: {
        horaInicio: ventanaDocente.hora_inicio,
        horaFin: ventanaDocente.hora_fin,
        fecha: ventanaDocente.fecha,
        intervaloMinutos: ventanaDocente.intervalo_minutos
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
