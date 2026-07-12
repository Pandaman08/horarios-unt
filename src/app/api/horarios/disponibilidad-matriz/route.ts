import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper: Verificar si el docente tiene CargaLectiva en el período
async function tieneCarhaLectiva(docenteId: number, periodoId: number): Promise<boolean> {
  const carga = await prisma.cargaLectiva.findFirst({
    where: {
      declaracion: {
        id_docente: docenteId,
        id_periodo: periodoId
      }
    }
  });
  return !!carga;
}

// Helper: Verificar si el docente ya confirmó su carga lectiva
async function tieneLectivaConfirmada(docenteId: number, periodoId: number): Promise<boolean> {
  const declaracion = await prisma.declaracionHoraria.findUnique({
    where: {
      id_docente_id_periodo: {
        id_docente: docenteId,
        id_periodo: periodoId,
      },
    },
    select: { estado: true },
  });

  const estadosConLectiva = [
    'LECTIVA_CONFIRMADA',
    'ENVIADO',
    'VALIDADO_DEPARTAMENTO',
    'APROBADO',
    'RECHAZADO',
  ];

  return !!declaracion?.estado && estadosConLectiva.includes(declaracion.estado);
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_periodo = searchParams.get('id_periodo');
    const id_ambiente = searchParams.get('id_ambiente');
    const id_docente = searchParams.get('id_docente');
    const id_curso = searchParams.get('id_curso');
    const id_grupo = searchParams.get('id_grupo');
    const modoConsulta = searchParams.get('modo_consulta') === '1';

    if (!id_periodo) return NextResponse.json({ error: 'Falta id_periodo' }, { status: 400 });

    let lectivaConfirmada = false;

    // Si se proporciona id_docente, validar acceso
    if (id_docente) {
      const docenteId = parseInt(id_docente);
      const periodoId = parseInt(id_periodo);

      // Verificar que el docente tenga CargaLectiva
      const tieneCarga = await tieneCarhaLectiva(docenteId, periodoId);
      if (!tieneCarga) {
        return NextResponse.json({
          asignaciones: [],
          temporales: [],
          tienePermiso: false,
          mensaje: 'No tienes cursos asignados para este período'
        });
      }

      lectivaConfirmada = await tieneLectivaConfirmada(docenteId, periodoId);

      // Fuera de ventana solo bloquea la edición; en consulta, modo secretaria o con lectiva confirmada se permite ver
      const session = await getServerSession(authOptions);
      const esOperadorAdmin = session && ['secretaria', 'administrador_sistema', 'operador_horarios'].includes(session.user?.rol || '');
      if (!modoConsulta && !lectivaConfirmada && !esOperadorAdmin) {
        const ventanas = await prisma.ventanaAtencion.findMany({
          where: { id_periodo: periodoId }
        });

        if (ventanas.length > 0) {
          const dentroVentana = await estaDentroDeVentana(docenteId, periodoId);
          if (!dentroVentana) {
            return NextResponse.json({
              asignaciones: [],
              temporales: [],
              tienePermiso: false,
              mensaje: 'Estás fuera de tu ventana de atención'
            });
          }
        }
      }
    }

    // Verificar si hay ventanas de tiempo para este período (modo intervalo)
    const ventanas = await prisma.ventanaAtencion.count({
      where: { id_periodo: parseInt(id_periodo) }
    });

    const esModoIntervalo = ventanas > 0;

    // Lógica para filtrar horarios:
    // 1. En modo INTERVALO:
    //    - Mostrar TODOS los horarios CONFIRMADOS (de cualquier docente)
    //    - Mostrar los horarios temporales SOLO del docente actual
    // 2. En modo AUTOMÁTICO:
    //    - Mostrar todos los horarios con filtro de ambiente
    
    // Primero: OBTENER TODOS LOS HORARIOS CONFIRMADOS (estos no cambian y deben estar visibles para todos)
    const whereConfirmados: any = { 
      id_periodo: parseInt(id_periodo), 
      OR: [
        { estado: 'confirmado' },
        { estado: 'definitivo' }
      ]
    };
    
    if (id_ambiente) {
      whereConfirmados.id_ambiente = parseInt(id_ambiente);
    }
    
    // Segundo: OBTENER LOS HORARIOS TEMPORALES SOLO DEL DOCENTE ACTUAL
    const whereTemporales: any = { 
      id_periodo: parseInt(id_periodo),
      fecha_expiracion: { gt: new Date() }
    };
    
    if (esModoIntervalo && id_docente) {
      // En modo intervalo: SOLO temporales del docente actual
      whereTemporales.id_docente = parseInt(id_docente);
    } else {
      // En modo automático: todos los temporales, filtrados por ambiente
      if (id_ambiente) {
        whereTemporales.id_ambiente = parseInt(id_ambiente);
      }
      // Y también incluimos los del docente actual para que siempre los vea
      if (id_docente) {
        whereTemporales.OR = [
          { id_docente: parseInt(id_docente) },
          { id_ambiente: id_ambiente ? parseInt(id_ambiente) : undefined }
        ];
      }
    }

    // Obtener horarios CONFIRMADOS (estos son visibles para todos)
    let asignaciones = await prisma.horarioAsignado.findMany({
      where: whereConfirmados,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    // En modo consulta, asegurar que los horarios propios del curso/grupo se muestren
    // aunque el ambiente seleccionado en la UI no coincida
    if (
      (modoConsulta || lectivaConfirmada) &&
      id_docente &&
      id_curso &&
      id_grupo
    ) {
      const misHorariosCurso = await prisma.horarioAsignado.findMany({
        where: {
          id_periodo: parseInt(id_periodo),
          id_docente: parseInt(id_docente),
          id_curso: parseInt(id_curso),
          id_grupo: parseInt(id_grupo),
          OR: [{ estado: 'confirmado' }, { estado: 'definitivo' }],
        },
        include: {
          docente: true,
          curso: true,
          grupo: true,
          ambiente: true,
        },
      });

      const idsExistentes = new Set(
        asignaciones.map((a: { id_asignacion: number }) => a.id_asignacion),
      );
      for (const horario of misHorariosCurso) {
        if (!idsExistentes.has(horario.id_asignacion)) {
          asignaciones.push(horario);
        }
      }
    }

    // Obtener horarios TEMPORALES (solo del docente actual en modo intervalo)
    let temporales = await prisma.seleccionTemporalHorario.findMany({
      where: whereTemporales,
      include: {
        docente: true,
        curso: true,
        grupo: true,
        ambiente: true
      }
    });

    // Obtener slots de disponibilidad del docente actual (si se especificó)
    let disponibilidadSlots: Array<{ dia_semana: number; hora_inicio: string; disponible: boolean }> = [];
    if (id_docente) {
      const docenteId = parseInt(id_docente);
      const periodoId = parseInt(id_periodo);
      console.log(`🔍 [API disponibilidad-matriz] Consultando: docente=${docenteId} periodo=${periodoId}`);

      const rawDisponibilidad = await prisma.disponibilidadDocente.findMany({
        where: {
          id_docente: docenteId,
          id_periodo: periodoId,
        },
        select: {
          dia_semana: true,
          hora_inicio: true,
          disponible: true,
        },
      });

      console.log(`🔍 [API disponibilidad-matriz] Encontrados ${rawDisponibilidad.length} slots para docente=${docenteId} periodo=${periodoId}`);
      if (rawDisponibilidad.length > 0) {
        const disponibles = rawDisponibilidad.filter(s => s.disponible).length;
        const noDisponibles = rawDisponibilidad.filter(s => !s.disponible).length;
        console.log(`🔍 [API disponibilidad-matriz] Disponibles=${disponibles} NoDisponibles=${noDisponibles}`);
        console.log(`🔍 [API disponibilidad-matriz] Primeros 3 registros:`, JSON.stringify(rawDisponibilidad.slice(0, 3)));
      }

      // La BD ya almacena dia_semana como 0-5 (0=Lunes), mismo formato que la matriz
      disponibilidadSlots = rawDisponibilidad
        .filter((s: { hora_inicio: string }) => s.hora_inicio !== '12:00')
        .map((s: { dia_semana: number; hora_inicio: string; disponible: boolean }) => ({
          ...s
        }));
    }

    return NextResponse.json({
      asignaciones,
      temporales,
      disponibilidad: disponibilidadSlots,
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error);
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }
}
