import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ValidadorHorario } from '@/services/horarios/ValidadorHorario';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';
import { obtenerMensajeErrorValidacion } from '@/lib/horarios/mensajesValidacion';

// Helper: Verificar si el docente está dentro de su ventana de atención
async function estaDentroDeVentana(docenteId: number, periodoId: number): Promise<boolean> {
  const ventanas = await prisma.ventanaAtencion.findMany({
    where: {
      id_periodo: periodoId,
      activo: true,
      completado: false
    },
    orderBy: { orden_prioridad: 'asc' }
  });

  console.log('🔍 [VENTANA] Ventanas disponibles:', ventanas.length);

  if (ventanas.length === 0) {
    console.log('✅ [VENTANA] No hay ventanas, permitiendo acceso');
    return true;
  }

  // Obtener datos del docente
  const docente = await prisma.docente.findUnique({
    where: { id_docente: docenteId }
  });

  console.log('👤 [VENTANA] Datos del docente:', {
    id: docenteId,
    condicion: docente?.condicion,
    categoriaDocente: docente?.categoriaDocente
  });

  if (!docente) {
    console.log('❌ [VENTANA] Docente no encontrado');
    return false;
  }

  // Buscar ventana que coincida
  const ventanaDelDocente = ventanas.find((v: any) => 
    v.modalidad === (docente.condicion || '') &&
    v.categoria === (docente.categoriaDocente || '')
  );

  console.log('🪟 [VENTANA] Busca ventana con modalidad:', docente.condicion, 'y categoría:', docente.categoriaDocente);
  console.log('🪟 [VENTANA] Ventanas disponibles:', ventanas.map((v: any) => ({ modalidad: v.modalidad, categoria: v.categoria, fecha: v.fecha, hora_inicio: v.hora_inicio, hora_fin: v.hora_fin })));

  if (!ventanaDelDocente) {
    console.log('❌ [VENTANA] No se encontró ventana para esta modalidad/categoría');
    return false;
  }

  // Comparar fechas según el día local de la ventana
  const ahora = new Date();
  const hoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fechaVentanaLocal = new Date(
    ventanaDelDocente.fecha.getFullYear(),
    ventanaDelDocente.fecha.getMonth(),
    ventanaDelDocente.fecha.getDate()
  );

  console.log('📅 [VENTANA] Comparación de fechas (local):');
  console.log('   Hoy local:', hoyLocal.toISOString().split('T')[0]);
  console.log('   Ventana local:', fechaVentanaLocal.toISOString().split('T')[0]);

  if (hoyLocal.getTime() !== fechaVentanaLocal.getTime()) {
    console.log('❌ [VENTANA] No es el día de tu ventana');
    return false;
  }

  // Comparar horarios
  const [horaInicioH, horaInicioM] = ventanaDelDocente.hora_inicio.split(':').map(Number);
  const [horaFinH, horaFinM] = ventanaDelDocente.hora_fin.split(':').map(Number);
  const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
  const minutoInicio = horaInicioH * 60 + horaInicioM;
  const minutoFin = horaFinH * 60 + horaFinM;

  console.log('⏱️  [VENTANA] Comparación de horarios:');
  console.log('   Hora actual:', `${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')} (minuto: ${minutoActual})`);
  console.log('   Ventana:', `${horaInicioH}:${horaInicioM.toString().padStart(2, '0')} - ${horaFinH}:${horaFinM.toString().padStart(2, '0')} (${minutoInicio} - ${minutoFin})`);

  const dentroDeHorario = minutoActual >= minutoInicio && minutoActual < minutoFin;
  console.log(`   ¿Dentro de horario?: ${dentroDeHorario}`);

  return dentroDeHorario;
}

// Helper: Verificar si el docente tiene el curso específico en CargaLectiva
async function tieneCargoEnCurso(docenteId: number, cursoId: number, periodoId: number): Promise<boolean> {
  const carga = await prisma.cargaLectiva.findFirst({
    where: {
      id_curso: cursoId,
      declaracion: {
        id_docente: docenteId,
        id_periodo: periodoId
      }
    }
  });
  return !!carga;
}

// Helper: Determinar si el docente A tiene mayor prioridad que el docente B según la ventana de atención
async function tienePrioridadSobre(docenteIdA: number, docenteIdB: number, periodoId: number): Promise<boolean> {
  const [docenteA, docenteB] = await Promise.all([
    prisma.docente.findUnique({ where: { id_docente: docenteIdA } }),
    prisma.docente.findUnique({ where: { id_docente: docenteIdB } }),
  ]);

  if (!docenteA || !docenteB) return false;

  const ventanas = await prisma.ventanaAtencion.findMany({
    where: { id_periodo: periodoId },
    orderBy: { orden_prioridad: 'asc' }
  });

  if (ventanas.length === 0) return false;

  const ventanaA = ventanas.find((v: any) =>
    v.modalidad === (docenteA.condicion || '') && v.categoria === (docenteA.categoriaDocente || '')
  );
  const ventanaB = ventanas.find((v: any) =>
    v.modalidad === (docenteB.condicion || '') && v.categoria === (docenteB.categoriaDocente || '')
  );

  if (!ventanaA || !ventanaB) return false;

  // Menor orden_prioridad = mayor prioridad
  return ventanaA.orden_prioridad < ventanaB.orden_prioridad;
}

function respuestaRechazo(validacion: Awaited<ReturnType<typeof ValidadorHorario.validarAsignacion>>) {
  return NextResponse.json(
    {
      ...validacion,
      error: obtenerMensajeErrorValidacion(validacion),
    },
    { status: 400 }
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json();

    const docenteId = parseInt(data.id_docente);
    const periodoId = parseInt(data.id_periodo);
    const cursoId = parseInt(data.id_curso);

    // === NUEVAS VALIDACIONES ===
    
    // 1. Verificar que el docente tenga el curso específico en CargaLectiva
    const tieneCurso = await tieneCargoEnCurso(docenteId, cursoId, periodoId);
    if (!tieneCurso) {
      return NextResponse.json({
        valido: false,
        error: 'No tienes este curso asignado en tu carga lectiva',
        conflictos: [{
          tipo: 'PERMISO_DENEGADO',
          mensaje: 'No tienes este curso asignado en tu carga lectiva',
          severidad: 'ERROR'
        }]
      }, { status: 403 });
    }

    // 2. Verificar que el docente esté dentro de su ventana de atención
    // Saltar esta verificación si es secretaria, administrador u operador
    const esOperadorAdmin = ['secretaria', 'administrador_sistema', 'operador_horarios'].includes(session?.user?.rol || '');
    if (!esOperadorAdmin) {
      const ventanas = await prisma.ventanaAtencion.findMany({
        where: { id_periodo: periodoId }
      });
      
      if (ventanas.length > 0) {
        const dentroVentana = await estaDentroDeVentana(docenteId, periodoId);
        if (!dentroVentana) {
          return NextResponse.json({
            valido: false,
            error: 'Estás fuera de tu ventana de atención',
            conflictos: [{
              tipo: 'VENTANA_CERRADA',
              mensaje: 'Estás fuera de tu ventana de atención',
              severidad: 'ERROR'
            }]
          }, { status: 403 });
        }
      }
    }

    // 1. Validar (Mapear snake_case a camelCase para el ValidadorHorario)
    const validacion = await ValidadorHorario.validarAsignacion({
      docenteId,
      cursoId,
      grupoId: parseInt(data.id_grupo),
      tipoClase: data.tipo_clase,
      ambienteId: parseInt(data.id_ambiente),
      diaSemana: parseInt(data.dia_semana),
      horaInicio: data.hora_inicio,
      horaFin: data.hora_fin,
      periodoId,
    });

    if (!validacion.valido) {
      // Si el error es un CRUCE_DOCENTE con el mismo docente, podemos permitir el "reemplazo"
      const cruceConmigo = validacion.conflictos.find(c => 
        c.tipo === 'CRUCE_DOCENTE' && 
        (c.detalle?.id_seleccion || c.detalle?.id_asignacion)
      );

      if (cruceConmigo) {
        // Procederemos a eliminar el anterior antes de crear el nuevo
        if (cruceConmigo.detalle?.id_asignacion) {
          await prisma.horarioAsignado.delete({ where: { id_asignacion: cruceConmigo.detalle.id_asignacion } });
        } else if (cruceConmigo.detalle?.id_seleccion) {
          await GestorSeleccionTemporal.eliminarSeleccion(cruceConmigo.detalle.id_seleccion);
        }
      } else {
        // Verificar si es un conflicto de ambiente con selección temporal de menor prioridad
        const ocupacionAmbiente = validacion.conflictos.find(c =>
          c.tipo === 'OCUPACION_AMBIENTE' &&
          c.detalle?.esTemporal &&
          c.detalle?.id_seleccion
        );

        if (ocupacionAmbiente && ocupacionAmbiente.detalle?.id_docente && ocupacionAmbiente.detalle.id_docente !== docenteId) {
          const tienePrioridad = await tienePrioridadSobre(docenteId, ocupacionAmbiente.detalle.id_docente, periodoId);
          if (tienePrioridad) {
            await GestorSeleccionTemporal.eliminarSeleccion(ocupacionAmbiente.detalle.id_seleccion);
          } else {
            return respuestaRechazo(validacion);
          }
        } else {
          return respuestaRechazo(validacion);
        }
      }
    }

    // 2. Crear selección temporal (Permite edición antes de confirmar)
    const seleccion = await GestorSeleccionTemporal.crearSeleccion({
      ...data,
      id_docente: docenteId,
      id_curso: cursoId,
      id_grupo: parseInt(data.id_grupo),
      id_ambiente: parseInt(data.id_ambiente),
      id_periodo: periodoId,
      dia_semana: parseInt(data.dia_semana),
      sesion_id: `sesion-${data.id_docente}-${data.id_periodo}`
    });

    return NextResponse.json({ valido: true, seleccion });
  } catch (error: any) {
    console.error('Error en seleccionar-celda:', error);
    return NextResponse.json({ 
      valido: false, 
      error: error.message || 'Error al seleccionar celda',
      conflictos: [{
        tipo: 'ERROR_SISTEMA',
        mensaje: error.message || 'Error interno del servidor',
        severidad: 'ERROR'
      }]
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_asignacion = searchParams.get('id_asignacion');
    const id_seleccion = searchParams.get('id_seleccion');

    if (id_asignacion) {
      await prisma.horarioAsignado.delete({
        where: { id_asignacion: parseInt(id_asignacion) }
      });
    } else if (id_seleccion) {
      await GestorSeleccionTemporal.eliminarSeleccion(parseInt(id_seleccion));
    } else {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error en eliminar-asignacion:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
